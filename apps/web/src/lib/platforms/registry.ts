import type { Platform } from "@smm/shared";
import { publishDemo } from "@/lib/platforms/demo";
import { metaFacebookPublisher } from "@/lib/platforms/meta-facebook";
import { linkedinPublisher } from "@/lib/platforms/linkedin";
import { xPublisher } from "@/lib/platforms/x-platform";
import type { PublishInput } from "@/lib/platforms/types";

export async function publishForPlatform(
  platform: Platform,
  input: PublishInput,
): Promise<string> {
  switch (platform) {
    case "demo": {
      return publishDemo({ snapshot: input.snapshot });
    }
    case "meta_facebook": {
      return metaFacebookPublisher.publish(input);
    }
    case "linkedin": {
      return linkedinPublisher.publish(input);
    }
    case "x": {
      return xPublisher.publish(input);
    }
    case "meta_instagram":
    case "tiktok":
    case "youtube": {
      throw new Error(`platform_coming_soon:${platform}`);
    }
    default:
      throw new Error(`platform_not_configured:${platform}`);
  }
}
