import type { PageLoad } from "../$types"
import { search } from "../../lib/api"

const getQuery = (url: URL) => {
    const query = url.searchParams.get("q") || url.searchParams.get("query")
    if (query) return query
}

export async function load({ url }: PageLoad) {
    const query = getQuery(url)
    let quotes = []
    if (query) {
        quotes = await search(query)
    }

    return {
        quotes,
        query
    }
}