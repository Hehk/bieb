<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { PageData } from '../$types';

	export let data : PageData;
	const { quotes, query } = data
</script>

<svelte:head>
	<title>Bieb</title>
	<meta name="description" content="Search the world of open books!" />
</svelte:head>

<section>
	<form>
		<input type="text" name="query" id="query" value={query} />
		<div class="search-icon">
			<Icon icon="uil:search" />
		</div>
	</form>
	
	{#if quotes.length === 0}
		<p>Search for a book</p>
	{:else}
		<ol>{#each quotes as quote}
			<li>
				<p class="quote">{quote.content}</p>
				<div class="book-link"><span>Book: </span><a href="{quote.link}">{quote.shortTitle}</a></div>
				<div>Authors: {quote.authors.join(', ')}</div>
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
