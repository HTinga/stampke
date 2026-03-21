import * as z from "zod";

export const ImageSchema = z.object({
    __image_url__: z.string(),
    __image_prompt__: z.string().min(10).max(50),
})

export const IconSchema = z.object({
    __icon_url__: z.string(),
    __icon_query__: z.string().min(5).max(20),
})