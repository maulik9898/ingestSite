import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { TreeViewItem } from "@/components/tree-view";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ParsedUrl {
  segments: string[];
  fullUrl: string;
  valid: boolean;
}

interface TrieNode {
  segment: string;
  children: Map<string, TrieNode>;
  isFile: boolean;
  fullUrl: string | null;
}

/**
 * Main function: given an array of URLs, returns a single array
 * of TreeViewItem. If there's a non-empty "Longest Common Path",
 * that becomes a single top-level folder. Otherwise multiple
 * top-level items are returned.
 */
export function urlsToTree(urls: string[]): TreeViewItem[] {
  // 1) Parse and filter out invalid/malformed URLs
  const parsedList: ParsedUrl[] = urls.map(parseUrl).filter((p) => p.valid);

  if (parsedList.length === 0) {
    return [];
  }

  // 2) Split each URL into an array of segments
  //    e.g. [ "https://docs.firecrawl.dev", "integrations", "langchain" ]
  const segmentsList = parsedList.map((p) => p.segments);

  // 3) Find the Longest Common Path (LCP) among all URLs
  const lcpSegments = findLongestCommonPrefix(segmentsList);

  // SPECIAL RULE: If we only have a single URL, remove the last segment from LCP
  // so that we treat the domain+middle paths as the “root folder” and the last
  // segment as a file. If the URL is domain-only (1 segment total), we skip this
  // because there is no deeper path to display.
  if (parsedList.length === 1 && lcpSegments.length > 1) {
    // Remove the final segment from the LCP
    lcpSegments.pop();
  }

  // 4) For each URL, remove the LCP from its segments so we can build a trie of
  //    only the differing sub-paths. The leftover “common prefix” (if any) will
  //    be turned into a single root node.
  const trimmedSegmentsList: ParsedUrl[] = [];

  for (let i = 0; i < parsedList.length; i++) {
    const { segments, fullUrl } = parsedList[i];

    // Remove LCP from the front
    const leftover = segments.slice(lcpSegments.length);
    trimmedSegmentsList.push({
      fullUrl,
      valid: true,
      segments: leftover,
    });
  }

  // 5) Build a trie from the leftover segments
  const trieRoot: TrieNode = {
    segment: "",
    children: new Map(),
    isFile: false,
    fullUrl: null,
  };

  for (const item of trimmedSegmentsList) {
    insertIntoTrie(trieRoot, item.segments, item.fullUrl);
  }

  // 6) Convert trie to TreeViewItem array
  const subTree = trieToTreeItems(trieRoot.children, []);

  // 7) If the LCP is empty, just return subTree as the top-level items
  if (lcpSegments.length === 0) {
    return subTree;
  }

  // Otherwise, create exactly one top-level node for the LCP
  // Its "id" will be the LCP re-joined as a path or raw domain
  const rootNodeId = rejoinSegments(lcpSegments);
  const rootNode: TreeViewItem = {
    id: rootNodeId,
    name: lcpSegments[lcpSegments.length - 1] || "/",
    type: "folder",
    children: subTree.length ? subTree : undefined,
  };

  return [rootNode];
}

/**
 * Safely parse a URL into segment array:
 * e.g.   https://docs.firecrawl.dev/integrations/langchain
 * =>     [ "https://docs.firecrawl.dev", "integrations", "langchain" ]
 * We preserve case and attach query+hash to the final segment, if any.
 */
function parseUrl(raw: string): ParsedUrl {
  try {
    const urlObj = new URL(raw);
    // The first segment is domain with protocol: e.g. "https://docs.firecrawl.dev"
    const base = `${urlObj.protocol}//${urlObj.host}`;

    // Split path (ignoring empty segments). E.g. /integrations/langchain => [ "integrations", "langchain" ]
    const pathSegments = urlObj.pathname
      .split("/")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // If there's search or hash, append to the last segment
    if (urlObj.search || urlObj.hash) {
      if (pathSegments.length === 0) {
        // e.g. domain.com/?q=abc => treat it as one empty path seg, then attach ?q=abc
        pathSegments.push(urlObj.search + urlObj.hash);
      } else {
        const last = pathSegments[pathSegments.length - 1];
        pathSegments[pathSegments.length - 1] =
          last + urlObj.search + urlObj.hash;
      }
    }

    // Full segments = [ baseDomain, ...pathSegments ]
    const segments = [base, ...pathSegments];
    return { segments, fullUrl: raw, valid: true };
  } catch {
    // Invalid / malformed URL
    return { segments: [], fullUrl: raw, valid: false };
  }
}

/**
 * Insert path segments into the trie. The final node is marked as a file
 * with "fullUrl".
 */
function insertIntoTrie(root: TrieNode, segments: string[], fullUrl: string) {
  let current = root;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!current.children.has(seg)) {
      current.children.set(seg, {
        segment: seg,
        children: new Map(),
        isFile: false,
        fullUrl: null,
      });
    }
    let nextNode = current.children.get(seg);
    if (!nextNode) {
      // If this child doesn't exist yet, create it.
      nextNode = {
        segment: seg,
        children: new Map(),
        isFile: false,
        fullUrl: null,
      };
      current.children.set(seg, nextNode);
    }
    current = nextNode;
  }
  // Mark final node as a file node
  current.isFile = true;
  current.fullUrl = fullUrl;
}

/**
 * Convert trie children into an array of TreeViewItems.
 */
function trieToTreeItems(
  map: Map<string, TrieNode>,
  path: string[],
): TreeViewItem[] {
  const items: TreeViewItem[] = [];
  for (const node of map.values()) {
    const hasChildren = node.children.size > 0;
    // If this node has children, treat it as a folder (but we still preserve file URL if it is also a file).
    const type: "file" | "folder" = hasChildren ? "folder" : "file";

    let id: string;
    if (node.isFile && node.fullUrl) {
      // This node corresponds to an actual URL. Use the full URL as "id"
      id = node.fullUrl;
    } else {
      // Otherwise, build an approximate path from parents + segment
      const fullPath = [...path, node.segment];
      id = rejoinSegments(fullPath);
    }

    const item: TreeViewItem = {
      id,
      name: node.segment || "/", // Fallback for domain root
      type,
    };

    if (hasChildren) {
      item.children = trieToTreeItems(node.children, [...path, node.segment]);
    }

    items.push(item);
  }
  return items;
}

/**
 * Rejoin segments into a single string. If the first segment is a domain,
 * we combine that plus each subsequent segment with "/".
 */
function rejoinSegments(segments: string[]): string {
  if (segments.length === 0) {
    return "";
  }
  // The first segment is always the domain with protocol
  const [domain, ...rest] = segments;
  if (rest.length === 0) {
    return domain;
  }
  // Join the rest with "/"
  return `${domain}/${rest.join("/")}`;
}

/**
 * Find the longest common prefix (array of segments) among all sets of segments.
 * Example:
 *   [ ['A','B','C'], ['A','B','D'] ] => ['A','B']
 */
function findLongestCommonPrefix(allPaths: string[][]): string[] {
  if (allPaths.length === 0) {
    return [];
  }
  // Start with the first path's segments
  let prefix = [...allPaths[0]];

  // Compare with each subsequent path
  for (let i = 1; i < allPaths.length; i++) {
    const nextPath = allPaths[i];
    // Truncate prefix where they stop matching
    let j = 0;
    while (
      j < prefix.length &&
      j < nextPath.length &&
      prefix[j] === nextPath[j]
    ) {
      j++;
    }
    prefix = prefix.slice(0, j);
    if (prefix.length === 0) {
      break;
    }
  }
  return prefix;
}
