import { BlogPost } from "../types/Blog";

export const sampleBlogs: BlogPost[] = [
  {
    id: "1",
    slug: "golden-hour-portraits",
    title: "Mastering Golden Hour Portraits",
    description:
      "Tips for taking breathtaking portraits during golden hour — gear, settings, and composition.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1200&auto=format&fit=crop",
    contentHtml:
      `<p>The <strong>golden hour</strong> is a photographer’s best friend. The soft, warm light creates flattering skin tones and magical backlight. Start by choosing a location with open sky and interesting background elements.</p>
      <p>Camera settings that work well: <em>aperture</em> between f/1.8–f/2.8 for shallow depth, <em>shutter</em> 1/200–1/800s to freeze motion, and <em>ISO</em> as low as possible. For more on exposure triangle, read <a href="https://photographylife.com/what-is-exposure-triangle" target="_blank" rel="noopener noreferrer">this guide</a>.</p>
      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop" alt="Golden hour backlight" />
      <p>Try placing the subject with the sun behind them, then use a reflector or slight fill flash to lift shadows.</p>
      <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop" alt="Portrait closeup" />
      <p>Finally, communicate with your subject to capture authentic expressions.</p>`,
    conclusion:
      "Golden hour rewards planning and patience — scout early, shoot fast, and watch the light.",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "2",
    slug: "cityscape-night-photography",
    title: "Cityscapes at Night: A Beginner’s Guide",
    description:
      "How to shoot sharp and vibrant cityscapes after dark with minimal noise.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1200&auto=format&fit=crop",
    contentHtml:
      `<p>Night photography requires stability. Bring a <strong>tripod</strong> and enable a 2-second timer to avoid shake.</p>
      <p>Start with ISO 100–200, aperture f/8–f/11, and adjust shutter speed for correct exposure. Consider <a href="https://www.exposureguide.com/night-photography-tips/" target="_blank" rel="noopener noreferrer">these tips</a> for long exposures.</p>
      <img src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1200&auto=format&fit=crop" alt="Cityscape long exposure" />
      <p>Watch out for color casts from street lights; shoot RAW to fix white balance later.</p>`,
    conclusion:
      "With a tripod and patience, the city at night turns into a canvas of light.",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "3",
    slug: "wedding-stories-prep",
    title: "Capturing Wedding Prep Stories",
    description:
      "A candid approach to wedding day preparation — details that make stories.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop",
    contentHtml:
      `<p>Wedding prep is full of emotions. Focus on <strong>hands</strong>, <strong>details</strong>, and <strong>small interactions</strong>.</p>
      <p>Keep a 35mm or 50mm prime for light rooms. For posing inspiration, see <a href="https://shotkit.com/wedding-photography-poses/" target="_blank" rel="noopener noreferrer">this wedding posing guide</a>.</p>
      <img src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop" alt="Wedding prep details" />
      <img src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop" alt="Bridal portrait" />
      <p>Use window light for gentle contrast and keep your shutter above 1/160s to avoid motion blur.</p>`,
    conclusion:
      "Details tell the story — anticipate moments and stay unobtrusive.",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "4",
    slug: "product-shoot-lighting",
    title: "Simple Lighting for Product Shoots",
    description:
      "Create clean, consistent product photos using one light and reflectors.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop",
    contentHtml:
      `<p>You can achieve professional results with a single softbox at 45°. Add white foam boards to bounce fill light.</p>
      <p>For consistent color, set a custom white balance or use a grey card. Read more on <a href="https://fstoppers.com/education" target="_blank" rel="noopener noreferrer">lighting education</a>.</p>
      <img src="https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1200&auto=format&fit=crop" alt="Product on seamless" />
      <p>Keep your background wrinkle-free and mind reflections on glossy objects.</p>`,
    conclusion:
      "Control light first; editing becomes quick and consistent.",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "5",
    slug: "family-photos-posing",
    title: "Natural Posing for Family Photos",
    description:
      "Prompts and compositions for stress-free family sessions.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
    contentHtml:
      `<p>Give families simple <em>prompts</em> rather than strict poses: “walk towards me holding hands”, “look at the youngest”, “group hug”.</p>
      <p>Keep the session playful and short for kids. Consider <a href="https://clickcommunity.com/blog/interactive-prompts/" target="_blank" rel="noopener noreferrer">interactive prompts</a> to spark genuine moments.</p>
      <img src="https://images.unsplash.com/photo-1504194104404-433180773017?q=80&w=1200&auto=format&fit=crop" alt="Family walking" />
      <p>Shoot in open shade for soft light and even skin tones.</p>`,
    conclusion:
      "Connection beats perfection — capture the laughter and the in-betweens.",
    publishedAt: new Date().toISOString(),
  },
];