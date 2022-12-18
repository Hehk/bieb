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
		<ol>{#each results as result}
			<li>
				<p class="quote">{result.content}</p>
				<div class="book-link"><span>Book: </span><a href="{result.link}">{result.shortTitle}</a></div>
				<div>Authors: {result.authors.join(', ')}</div>
			</li>
		{/each}</ol>
	{/if}
		
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
	
	ol {
		list-style: none;
		padding: 0;
	}
	
	.quote {
		font-family: var(--font-serif);
		line-height: 1.5rem;
	}
	.quote::before {
		content: '“';
		font-weight: bold;
		color: var(--color-theme-1);
	}
	.quote::after {
		content: '”';
		font-weight: bold;
		color: var(--color-theme-1);
	}
	
	.book-link {
		display: block;
	}
	li {
		margin-bottom: 2rem;
	}

</style>
