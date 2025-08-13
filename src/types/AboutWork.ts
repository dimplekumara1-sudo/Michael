export interface AboutWorkSection {
  id: string;
  title: string;
  description: string;
  youtube_video_id: string;
  video_title: string;
  video_description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAboutWorkSection {
  title: string;
  description: string;
  youtube_video_id: string;
  video_title: string;
  video_description: string;
}

export interface UpdateAboutWorkSection {
  title?: string;
  description?: string;
  youtube_video_id?: string;
  video_title?: string;
  video_description?: string;
}