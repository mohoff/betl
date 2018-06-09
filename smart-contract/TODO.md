TODO
====

- Add betStartTime... in addition to timeout
	* starting 'right now' preferred though to reduce complexity

- Usecases for bet modes?
	* Right now, list of options with variable winner/payout scheme

- Maybe map bet configurations into betMode numbers
	* So these if-else structures can moved to client-side. Client just picks a betMode
	  and the smart contract knows what this betMode means (if flexOptions, if multipleWinnersAllowed, etc.)