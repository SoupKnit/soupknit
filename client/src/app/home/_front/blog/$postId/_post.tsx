import { Suspense } from "react"
import { Await, createFileRoute, defer, Outlet } from "@tanstack/react-router"
import { z } from "zod"

import { fetchPost } from "@/api/fetch-post.example"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/home/_front/blog/$postId/_post")({
  component: PostLayout,
  parseParams: (params) =>
    z.object({ postId: z.coerce.number().int() }).parse(params),
  loader: ({ params }) => {
    const post = fetchPost({ id: params.postId })
    return {
      post: defer(post),
    }
  },
})

function PostLayout() {
  const { post } = Route.useLoaderData()

  return (
    <div className="w-full space-y-12">
      <header className="border-b bg-card py-12">
        <div className="container">
          <h1 className="text-3xl">
            <Suspense fallback={<Skeleton>Post title</Skeleton>}>
              <Await promise={post}>{(post) => post.title}</Await>
            </Suspense>
          </h1>
        </div>
      </header>
      <div className="container">
        <Outlet />
      </div>
    </div>
  )
}
