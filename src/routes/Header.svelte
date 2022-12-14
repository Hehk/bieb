<script>
</script>

<header>
	<ol class="navigation">
		<li><a href="/">Home</a></li>
		<li><a href="/about">About</a></li>	
	</ol>
	<h1>Bieb</h1>
	<ol>
		<li><a href="https://github.com/hehk/bieb">Github</a></li>
		<li><a href="/collections">Collections</a></li>	
	</ol>
</header>

<style>
	header {
		display: flex;
		padding: 2rem 0 2rem 0;
		width: var(--container-width);
		margin: 0 auto;
		justify-content: space-between;
	}
	
	h1 {
		margin: 0 auto;
		position: absolute;
		width: 10rem;
		text-align: center;
		left: calc(50% - 5rem);
		font-size: 3rem;
		line-height: 3rem;
	}
	
	ol {
		display: flex;
		list-style: none;
		padding-left: 0;
		margin: 0;
		line-height: 3rem;
	}
	
	li::after {
		content: " / ";
		color: gray;
		padding-left: 1rem;
		padding-right: 1rem;
	}
	li:last-child:after {
		content: "";
		padding: 0;
	}
</style>
