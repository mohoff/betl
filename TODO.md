TODO
====


Smart contract
--------------
- Make sure that only one round is created per blocktime to avoid shadow/dup rounds.
- Add betStartTime... in addition to timeout
	* starting 'right now' preferred though to reduce complexity

- Usecases for bet modes?
	* Right now, list of options with variable winner/payout scheme

- Maybe map bet configurations into betMode numbers
	* So these if-else structures can moved to client-side. Client just picks a betMode
	  and the smart contract knows what this betMode means (if flexOptions, if multipleWinnersAllowed, etc.)

Frontend
--------
- Make Registration box an own component
- After 2s of showing <MetaMaskLoading/>, add text: 'Are you connected to the internet?'
- <section>ify all components. are somehow more structure and consistent layout
- use dot notation when referencing react components. see 'jsx in depth' doc page
- use map instead of for-loop when creating options JSX. see https://reactjs.org/docs/jsx-in-depth.html
	* or use Repeat syntax (same doc page, bit further down)
- show a progressbar based on time left to bet
	* https://bulma.io/documentation/elements/progress/
