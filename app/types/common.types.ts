export interface IPaginationMeta {
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}
export interface IFile {
  id: string
  createdAt: string
  updatedAt: string
  alt: string
  url: string
  filename: string
  mimeType: string
  filesize: number
  width: number
  height: number
}

export interface IMediaItem extends IFile {
  focalX: number
  focalY: number
  sizes: {
    thumbnail: {
      url: string
      width: number
      height: number
      mimeType: string
      filesize: number
      filename: string
    };
    card: {
      url: string
      width: number
      height: number
      mimeType: string
      filesize: number
      filename: string
    };
  };
  thumbnailURL: string
}

export type MediaImage = IMediaItem

export type MediaArray = MediaImage[]
