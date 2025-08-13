create view public.latest_work_with_stats as
select
  mp.id,
  mp.title,
  mp.caption,
  mp.media_type,
  mp.media_url,
  mp.thumbnail,
  mp.likes,
  mp.created_at,
  mp.updated_at,
  mp.is_active,
  mp.location,
  mp.youtube_url,
  mp.category,
  COALESCE(like_counts.like_count, 0::bigint) as like_count,
  COALESCE(comment_counts.comment_count, 0::bigint) as comment_count
from
  media_posts mp
  left join (
    select
      post_likes.media_post_id,
      count(*) as like_count
    from
      post_likes
    group by
      post_likes.media_post_id
  ) like_counts on mp.id = like_counts.media_post_id
  left join (
    select
      post_comments.media_post_id,
      count(*) as comment_count
    from
      post_comments
    group by
      post_comments.media_post_id
  ) comment_counts on mp.id = comment_counts.media_post_id
where
  mp.media_type = 'latest_work'::media_type;