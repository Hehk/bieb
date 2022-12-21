import type { PageLoad } from "../$types"
import { search } from "../../lib/api"

const getQuery = (url: URL) => {
    const query = url.searchParams.get("q") || url.searchParams.get("query")
    if (query) return query
}

type Response = {
    quotes: string[]
    query?: string
}

export const load = (async ({ url }) : Promise<Response> => {
    const query = getQuery(url)
    let quotes = []
    if (query) {
        quotes = await search(query)
    }

    return {
        quotes,
        query
    }
}) satisfies PageLoad<Response>