import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { fetchPost } from "@/api/fetch-post.example"
import { Seo } from "@/components/layout/seo"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/home/_front/blog/$postId/_post/")({
  parseParams: (params) =>
    z.object({ postId: z.coerce.number().int() }).parse(params),
  stringifyParams: ({ postId }) => ({ postId: `${postId}` }),
  loader: async ({ params }) => {
    const post = await fetchPost({ id: params.postId })
    return {
      post,
    }
  },
  component: PostPage,
  pendingComponent: () => (
    <>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-2/3" />
    </>
  ),
})

function PostPage() {
  const { post } = Route.useLoaderData()

  return (
    <>
      <Seo title={post.title} />
      <article className="prose">{post.body}</article>
    </>
  )
}
