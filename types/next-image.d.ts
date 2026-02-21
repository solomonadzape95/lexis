declare module "next/image" {
  import type { ComponentProps } from "react";
  const Image: React.FC<
    ComponentProps<"img"> & {
      src: string | import("react").StaticImageData;
      alt: string;
      width?: number;
      height?: number;
      fill?: boolean;
      unoptimized?: boolean;
      priority?: boolean;
      placeholder?: "blur" | "empty";
      blurDataURL?: string;
      quality?: number;
    }
  >;
  export default Image;
}
