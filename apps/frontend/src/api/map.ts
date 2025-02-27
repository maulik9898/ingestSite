import { axiosInstance } from "@/lib/axios";
import type { Map200Response, MapBody } from "common-types";

export const mapSite = async (data: MapBody) => {
  const response = await axiosInstance.post<Map200Response>("/map", data);
  return response.data;
};
