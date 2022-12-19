// For now, I am going to dump all of the API calls in here.

const modelUrl = `http://localhost:${process.env.MODEL_PORT || 5000}`

export const search = async (query: string) => {
    const response = await fetch(`${modelUrl}/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({query})
    })
    const json = await response.json()
    return json.results
}