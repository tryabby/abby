import { z } from "zod";

export const addCommandTypeSchema = z.enum(["flag", "config"]);
