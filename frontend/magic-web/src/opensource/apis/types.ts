export type FetcherOptions = {
	unwrapData?: boolean
}

export type Fetcher = <D = unknown>(
	...args: [Parameters<typeof fetch>[0], options?: Parameters<typeof fetch>[1] & FetcherOptions]
) => Promise<D>
