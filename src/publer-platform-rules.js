// =============================================
// PUBLER PLATFORM RULES — Restricciones por Red Social
// =============================================
// Este módulo define las reglas y limitaciones de cada plataforma
// cuando se publica a través de Publer API.
// El agente DEBE respetar estas reglas al generar contenido.
// =============================================

export const PLATFORM_RULES = {
  instagram: {
    provider: "instagram",
    name: "Instagram",
    content_types: ["photo", "video", "carousel", "story", "reel"],
    character_limit: 2200,
    image: {
      optimal_dimensions: "1080x1080px",
      aspect_ratio: "1:1 to 4:5",
      max_file_size: "8MB",
      formats: ["JPEG", "PNG", "WEBP"],
      min_resolution: "320x320px",
      max_photos_per_post: 10,
    },
    video: {
      optimal_dimensions: "1080x1920px",
      aspect_ratio: "9:16",
      duration: "3s - 60min",
      max_file_size: "650MB",
      reels_duration: "3s - 90s",
      stories_duration: "15s per segment",
    },
    special_rules: [
      "Business account required for API posting",
      "Square 1:1 recommended for feed posts",
      "Links in captions are NOT clickable",
      "First comment can be auto-posted with hashtags",
      "Cannot mix photos with GIFs or videos in carousel",
    ],
    api_format_example: {
      type: "photo",
      text: "Caption with #hashtags",
      media: [{ id: "MEDIA_ID", type: "image" }],
    },
    hashtag_rules: {
      max_recommended: 30,
      optimal: "5-8 relevant hashtags",
      placement: "In caption or first comment",
    },
  },

  tiktok: {
    provider: "tiktok",
    name: "TikTok",
    content_types: ["video", "photo", "carousel"],
    character_limit: 2200,
    image: {
      max_photos_per_carousel: 35,
      no_size_restriction: true,
      note: "Cannot mix photos with GIFs or videos",
    },
    video: {
      optimal_dimensions: "1080x1920px",
      aspect_ratio: "9:16 (vertical REQUIRED)",
      duration: "3s - 10min",
      max_file_size: "500MB",
    },
    special_rules: [
      "Business account required for API posting",
      "Vertical video format 9:16 is REQUIRED",
      "Cannot edit video after posting",
      "Can only post to ONE TikTok account at a time (no duplicates)",
      "Sound/music highly recommended",
      "Photo posts supported as single or multi-photo carousel",
      "Photo posts require at least one photo (no text-only)",
    ],
    api_format_example: {
      type: "photo",
      text: "Caption with #hashtags #fyp",
      media: [{ id: "MEDIA_ID", type: "image" }],
    },
    hashtag_rules: {
      max_recommended: 5,
      optimal: "3-5 trending + brand hashtags",
      placement: "In caption, #fyp and niche tags",
    },
  },

  facebook: {
    provider: "facebook",
    name: "Facebook",
    content_types: ["status", "photo", "video", "link", "carousel", "story", "reel"],
    character_limit: 10000,
    image: {
      optimal_dimensions: "1200x630px",
      aspect_ratio: "1.91:1",
      max_file_size: "8MB",
      formats: ["JPEG", "PNG", "WEBP"],
      max_photos_per_post: "Unlimited",
    },
    video: {
      optimal_dimensions: "1280x720px",
      aspect_ratio: "16:9 to 9:16",
      duration: "1s - 240min",
      max_file_size: "10GB",
    },
    special_rules: [
      "Page permissions required for business pages",
      "Hashtags supported but used less than other platforms",
      "Link previews auto-generated from URL",
      "Text-only status posts are allowed",
    ],
    api_format_example: {
      type: "photo",
      text: "Post text with details",
      media: [{ id: "MEDIA_ID", type: "image" }],
    },
    hashtag_rules: {
      max_recommended: 5,
      optimal: "1-3 relevant hashtags",
      placement: "In post text, sparingly",
    },
  },

  linkedin: {
    provider: "linkedin",
    name: "LinkedIn",
    content_types: ["status", "photo", "video", "link", "document", "polls"],
    character_limit: 3000,
    image: {
      optimal_dimensions: "1200x627px",
      aspect_ratio: "1.91:1",
      max_file_size: "5MB",
      max_photos_per_post: 20,
      note: "Photos and GIFs supported, cannot mix with videos",
    },
    video: {
      optimal_dimensions: "1920x1080px",
      aspect_ratio: "16:9",
      duration: "3s - 15min",
      max_file_size: "5GB",
    },
    special_rules: [
      "Supports markdown-style formatting (bold, italic, bullets)",
      "Company page access requires admin privileges",
      "Professional tone recommended",
      "PDF carousels supported (up to 100 pages)",
      "Documents: PDF format, 100MB max",
      "Polls: text only, up to 30 characters per option",
    ],
    api_format_example: {
      type: "photo",
      text: "Professional content with **bold** and bullet points",
      media: [{ id: "MEDIA_ID", type: "image" }],
    },
    hashtag_rules: {
      max_recommended: 5,
      optimal: "3-5 professional/industry hashtags",
      placement: "At end of post",
    },
  },

  twitter: {
    provider: "twitter",
    name: "X / Twitter",
    content_types: ["status", "photo", "video", "link", "poll"],
    character_limit: 280,
    character_limit_premium: 25000,
    image: {
      optimal_dimensions: "1200x675px",
      aspect_ratio: "16:9",
      max_file_size: "5MB",
      formats: ["JPEG", "PNG", "WEBP"],
      max_photos_per_post: 4,
    },
    video: {
      optimal_dimensions: "1280x720px",
      aspect_ratio: "16:9",
      duration: "0.5s - 140s",
      max_file_size: "512MB",
    },
    special_rules: [
      "URLs count as 23 characters regardless of actual length",
      "Hashtags and @mentions count toward character limit",
      "Media attachments do NOT count toward 280 character limit",
      "Alt text for images highly recommended",
      "GIFs limited to 15MB",
    ],
    api_format_example: {
      type: "photo",
      text: "Concise post with #hashtags",
      media: [{ id: "MEDIA_ID", type: "image" }],
    },
    hashtag_rules: {
      max_recommended: 3,
      optimal: "1-2 relevant hashtags",
      placement: "Inline in tweet text",
    },
  },
};

// =============================================
// Helper: Get rules summary for system prompt injection
// =============================================
export function getPlatformRulesForPrompt(platforms = ["instagram", "tiktok", "facebook"]) {
  return platforms
    .map((p) => {
      const rules = PLATFORM_RULES[p];
      if (!rules) return "";
      return `
### ${rules.name} (${rules.provider})
- Character limit: ${rules.character_limit}
- Image: ${rules.image.optimal_dimensions}, max ${rules.image.max_file_size || "no limit"}, ratio ${rules.image.aspect_ratio || "flexible"}
- Hashtags: ${rules.hashtag_rules.optimal}
- Special: ${rules.special_rules.join("; ")}
- Post type for photos: "${rules.api_format_example.type}"`;
    })
    .join("\n");
}

// =============================================
// Helper: Image generation size based on target platform
// =============================================
export function getImageSizeForPlatform(platform) {
  const sizes = {
    instagram: "1024x1024",    // Square for feed
    tiktok: "1024x1792",      // Vertical 9:16
    facebook: "1792x1024",    // Horizontal 1.91:1
    linkedin: "1792x1024",    // Horizontal 1.91:1
    twitter: "1792x1024",     // Horizontal 16:9
  };
  return sizes[platform] || "1024x1024";
}
