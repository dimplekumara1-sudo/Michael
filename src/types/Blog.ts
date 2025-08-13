export interface BlogPost {
  id: string;
  slug: string; // for routing
  title: string;
  description: string; // short summary shown on cards
  thumbnailUrl: string; // image thumbnail (main image)
  contentHtml: string; // main content as HTML (supports hyperlinks + up to 3 inline images)
  conclusion: string;
  publishedAt: string; // ISO date string
}