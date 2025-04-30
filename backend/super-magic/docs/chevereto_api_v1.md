# API Version 1.1

Chevereto API enables programmatic file uploads, allowing you to seamlessly integrate our uploading functionality into your own applications.

## Key

API V1.1 works with an user key which is available for each user at `/settings/api`.

Admin user can set the public API key for guest uploads at the Dashboard panel.

## Request method

API V1 calls can be made using POST or GET request methods.

POST request method is **recommended**.

## Request URL

```
http://mysite.com/api/1/upload
```

## Authorization

API V1.1 supports header authorization by passing the `X-API-Key` header with an API key.

```
X-API-Key: chv_key_here
```

## Parameters

### source

A binary file, base64 data, or a URL for an image.

### key (optional)

The API key. You can use this parameter if unable to provide auth via headers.

### title (optional)

File title. This is automatically detected from metadata if not provided.

### description (optional)

File description. This is automatically detected from metadata if not provided.

### tags (optional)

File tag(s). Comma separated list of tags.

### album_id (optional)

File album id, must be owned by the API key user.

### category_id (optional)

Category id. Determines the file category to assign.

### width (optional)

Target resize width, will automatic detect height.

### expiration (optional)

Expiration time to auto-delete the file in date interval format. For example, PT5M for five minutes in the future. P3D for three days in the future.

### nsfw (optional)

Not safe for work flag `[0, 1]`.

### format (optional)

Return format `[json, redirect, txt]`.

### use_file_date (optional, admin only)

Configure to use file date taken (Exif) instead of upload date `[0, 1]`.

## Example call

```
curl --fail-with-body -X POST \
  -H "X-API-Key: $key" \
  -H "Content-Type: multipart/form-data" \
  -F "source=@image.jpeg" \
  http://mysite.com/api/1/upload
```

## API response

API V1 responses will vary depending on the **format** parameter:

| Format   | Output                                     |
| -------- | ------------------------------------------ |
| json     | Image upload info in JSON format (default) |
| txt      | Image direct URL in text/plain format      |
| redirect | Redirects to the image viewer URL          |

When using JSON the response output will contain the `status_txt` and `status_code` properties.

## Example response (JSON)

```
{
  "status_code": 200,
  "success": {
    "message": "file uploaded",
    "code": 200
  },
  "image": {
    "name": "Badgers-animated-music-video",
    "extension": "mp4",
    "size": 3011299,
    "width": 496,
    "height": 360,
    "date": "2024-10-10 16:58:00",
    "date_gmt": "2024-10-10 19:58:00",
    "title": "Badgers animated music video MrWeebl",
    "tags": [],
    "description": null,
    "nsfw": 0,
    "storage_mode": "datefolder",
    "md5": "7a120d5c28de264bdbb934f023a628fd",
    "source_md5": null,
    "original_filename": "Badgers _ animated music video _ MrWeebl.mp4",
    "original_exifdata": null,
    "views": 0,
    "category_id": null,
    "chain": 21,
    "thumb_size": 21212,
    "medium_size": 0,
    "frame_size": 19804,
    "expiration_date_gmt": "2024-10-10 20:28:00",
    "likes": 0,
    "is_animated": 0,
    "is_approved": 1,
    "is_360": 0,
    "duration": 73,
    "type": "video",
    "tags_string": "",
    "file": {
      "resource": {
        "type": "url"
      }
    },
    "id_encoded": "ZfGd",
    "filename": "Badgers-animated-music-video.mp4",
    "mime": "video/mp4",
    "url": "http://localhost/images/2024/10/10/Badgers-animated-music-video.mp4",
    "ratio": 1.3777777777777778,
    "size_formatted": "3 MB",
    "frame": {
      "filename": "Badgers-animated-music-video.fr.jpeg",
      "name": "Badgers-animated-music-video.fr",
      "mime": "image/jpeg",
      "extension": "jpeg",
      "url": "http://localhost/images/2024/10/10/Badgers-animated-music-video.fr.jpeg",
      "size": 19804
    },
    "image": {
      "filename": "Badgers-animated-music-video.mp4",
      "name": "Badgers-animated-music-video",
      "mime": "video/mp4",
      "extension": "mp4",
      "url": "http://localhost/images/2024/10/10/Badgers-animated-music-video.mp4",
      "size": 3011299
    },
    "thumb": {
      "filename": "Badgers-animated-music-video.th.jpeg",
      "name": "Badgers-animated-music-video.th",
      "mime": "image/jpeg",
      "extension": "jpeg",
      "url": "http://localhost/images/2024/10/10/Badgers-animated-music-video.th.jpeg",
      "size": 21212
    },
    "url_frame": "http://localhost/images/2024/10/10/Badgers-animated-music-video.fr.jpeg",
    "medium": {
      "filename": null,
      "name": null,
      "mime": null,
      "extension": null,
      "url": null
    },
    "duration_time": "01:13",
    "url_viewer": "http://localhost/clip/Badgers-animated-music-video-MrWeebl.ZfGd",
    "path_viewer": "/clip/Badgers-animated-music-video-MrWeebl.ZfGd",
    "url_short": "http://localhost/clip/ZfGd",
    "display_url": "http://localhost/images/2024/10/10/Badgers-animated-music-video.fr.jpeg",
    "display_width": 496,
    "display_height": 360,
    "views_label": "views",
    "likes_label": "likes",
    "how_long_ago": "moments ago",
    "date_fixed_peer": "2024-10-10 19:58:00",
    "title_truncated": "Badgers animated music vi...",
    "title_truncated_html": "Badgers animated music vi...",
    "is_use_loader": false,
    "display_title": "Badgers animated music video MrWeebl",
    "delete_url": "http://localhost/clip/ZfGd/delete/e8b07479818bc58d3b9849c431e9c2b28827ccce7809ed4f"
  },
  "status_txt": "OK"
}
```

## Example response (txt)

```
http://localhost/images/2024/10/10/Badgers-animated-music-video.mp4
```

## Example response (redirect)

```
Location: /clip/Badgers-animated-music-video-MrWeebl.ZfGd
```
