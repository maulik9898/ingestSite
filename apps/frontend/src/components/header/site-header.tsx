import { MainNav } from "@/components/header/main-nav";

export function SiteHeader() {
  return (
    <header className="border-grid sticky top-0 z-50 w-full border-b border-dashed bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-wrapper">
        <div className="flex h-16 items-center w-full">
          <MainNav />
        </div>
      </div>
    </header>
  );
}
