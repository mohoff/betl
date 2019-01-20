http://www.gamblingcommission.gov.uk/for-gambling-businesses/Do-I-need-a-licence/Types-of-operating-licence.aspx

https://www.casinoratgeber24.com/gluecksspiel-lizenzen

https://www.mga.org.mt/support/frequently-asked-questions/

https://de.wikipedia.org/wiki/Sportwette

https://de.wikipedia.org/wiki/Unerlaubte_Veranstaltung_eines_Gl%C3%BCcksspiels

IDEAS
=====


- Streamers go to website and register their ethereum address
- then they can create bet contracts on their own. either one contract per bet or one contract per registered user (?)
- they get back bet contract address, which they publish to viewers/players.

- different types of bets to chose from:
	* binary outcome: yes, no with option to cancel and refund
	* 100 outcomes, mapped to int 0->99 or so
	* outcomes on scale X->Y in 1-er increments: (Y-X) outcomes
	* prediction of exact match results: 2:1, 5:5, 25:18, ...
- "late bets" --> allowed up to certain time delay, but with penalty.
- constructor takes amount of outcomes, bonus pool, and question as string, and timeout if any or just manual end. timeout safety when manual not ended.
- vote with ether: "which hero played next?"
- comission fees: 1% on bets, voting: 5%
- raffles: user call 'register' function of smart contract so that their address is added to array of participants. when ended, random number between 0->array.elength is chosen (oraclize?) and winner will be notified.
- streamer tokens as ERC20 tokens, capped supply, mintable, transferable
	* hmm rather not as MVP, too much.
- website has search field: filter by name of streamer/creater of bet. filter by contract address. by previously saved favorites. by twitch games.
- hard outcomes (win all or lose all), or soft outcomes when you earn a bit when you were close


## Betting with Token bonding curves, token economics
- maybe not bounded curves, but price plateaus? (more FOMO?)
	* UI: 4586 PLAY left until its price increases by 20%
	* UX: sucks when buy/sell is front-run and you get the worse price
- people convert there Ether in PLAY tokens
  * fixed rate, e.g. 1 ETH = 1000 PLAY
	* dynamic rate, depending on circulating supply/bonding curve
- global token PLAY vs token per streamer
	* global PLAY:
		- bonding curve: early adopters get more PLAY per ETH --> first-mover-advantage
		- immediate sell possible: PLAY -> ETH, at slightly worse rate? (two curves)
			* show on UI: if you sell 10/100/1000 PLAY now, you get X/Z/Y Ether in return
- one round:
  * bounding curve during one round is hard/impossible
		- block times make UX bad. Anticipated: 1000er stake, got: 600er stake coz front-run
  * has a pool of PLAY associated, players lock their POLY for round
	* total supply of PLAY changes? or just moving from loser to winner?
	* loser's PLAY is burnt and converted to ETH at current rate. All ETH retrieved is
	  evenly split among winners, who can claim their reward (claim timeout?)
		--> burns PLAY, so bounded rates just got 'better' again. Viewers want to buy new
		    PLAY with their (just won!) ether
		--> whales-lose: draw attention, as lots of PLAY will be burnt
- PLAY interaction with outside world:
	* ERC20? --> 0x-tradable?
		- creates a market outside of bounding curve? does it make sense?
		- only makes sense within the bounds of the buy-(upper) and
		  sell-(lower) bounding curve
- streamers can create betting rounds, provide options, and share link
- rewards:
	* directly PLAY tokens convertible back to ETH (fixed/dynamic rate)
	* PLAY tokens represent stake of a streamer viewership
		- used for giveaways
- multiplier
	* leverage stake with multiplier, "high-risk-high-reward"
