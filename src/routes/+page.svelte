<script>
	import Icon from '@iconify/svelte';

	$: results = []
	
	const onSubmit = async (e) => {
		const formData = new FormData(e.target)
		const search = formData.get('search')
		if (!search) return

		console.log(search)
		try {
			const response = await fetch('http://localhost:8000/search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ query: search })
			})
			const json = await response.json()
			results = json.results
		} catch (e) {
			console.error(e)
		}
	}
</script>

<svelte:head>
	<title>Bieb</title>
	<meta name="description" content="Search the world of open books!" />
</svelte:head>

<section>
	<form on:submit|preventDefault={onSubmit}>
		<input type="text" name="search" id="search" />
		<div class="search-icon">
			<Icon icon="uil:search" />
		</div>
	</form>
	
	{#if results.length === 0}
		<p>Search for a book</p>
	{:else}
		<h2>Results</h2>
	{/if}
	{#each results as result}
		<p>{result}</p>
	{/each}
	
</section>

<style>
	section {
		padding: 0 4rem;
	}

	form {
		width: 100%;
		position: relative;

		margin-top: 4rem;
		margin-bottom: 2rem;
	}
	
	form .search-icon {
		position: absolute;
		right: 1rem;
		top: 1rem;
		font-size: 1.5rem;
		line-height: 1rem;
	}

	input {
		width: 100%;
		background-color: var(--color-bg);
		font-size: 1rem;
		outline: none;
		border-radius: 0.25rem;
		padding: 1rem;
		padding-right: 2.75rem;
		border: 2px solid var(--color-text);
		box-shadow: 0px 0px 0 0 var(--color-text);
		transition: box-shadow 0.25s ease, border-color 0.25s ease;
	}
	
	input:focus {
		box-shadow: 0.25rem 0.25rem 0 0 var(--color-theme-1);
	}
	
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	p {
		text-align: left;
	}
</style>
