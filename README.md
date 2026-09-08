## hellooooooo
okay so like, since you're this curious and you're checking out the source code:
  - this is a react + vite site
  - i strictly did NOT use tailwind because i'm trying to learn CSS here
  - it's deployed via netlify

`i guess i'll put what i learned here then, as kind of a journal or log`

## home page
in this page i just got started learning react, i was pretty shocked how close it is, or i guess the fact that it literally IS just HTML but with JS like, shoehorned deep through it somehow. everything just works as expected, and you can use variables within the HTML itself instead of having to hardcode everything like a static site. 

though i guess the home page is just a static site...

but hey at least the learning curve won't be that bad, i thought to myself. at this point i was still thinking that it would be a single page thing (well, it kinda did, but not really a SPA in the traditional sense). still though, most of this was developed from gemini's boilerplate. while i did understand how i should be doing something like this in the future, i don't think i can start off an empty `App.jsx` or something...


## music page
this is where things get FUN. when making the music segment i (thankfully) quickly realize i didn't have enough space to put what i comfortably want here. i thought about some scroll takeover shi but like, i thought that would be a little too advanced for me that just wanted to make a sorta non static portofolio-ish site. so, i just use react-router for this. i could have used next.js, but there's too much vercel branding for when i wanted that (also i LITERALLY switched from next to react-vite because i didn't like it that much. i'll inevitably have to learn it though...)

at first i thought, how would i kinda show the music right? like, i can't just say `oh yeah demi lovato's i will survive is so much better` or something without the song itself to back it up. so i actually first thought of youtube music, the one i actually use to listen to music. i also quickly realize that it didn't even want to play copyrighted songs and i just don't like it in the end. my next thought is actually spotify but i realize i can just use apple music...

so there goes, now i have apple music embeds on them. it does slow the page pretty significantly, but it's not netlify loading it, so i'm not really hitting my limits or getting billed over this. it's inefficient but whatever. not like i can just host the rip of the song directly here without getting nuked. (i WAS actually about to do that but like, very quickly realize how quickly they'd nuke my site especially with autodetection), hell i even wanted to display **LYRICS**, just for the few parts i actually like along with 10s of audio or something. but i guess it is what it is.

#### UPDATE - SEPTEMBER 2026

i have... matured. netlify blobs were the way, for basically everything. there was a caching issue that i overlooked because of LLM slop but now it should always fetch fresh data. i also tried kawarp here, it didn't work because mimo 2.5 did NOT read kawarp's documentation. on react and on loading a blob, it should've used a hook. it should work just fine now, but i can't be assed to implement it (which now just means i don't wanna waste tokens on it lol).

i've also added a live lyrics thingy, it actually fetches from my own personal database. i have this script that polls better lyrics whenever i listen to a song, which should cache the lyrics. it's pretty neat. it also fetches from other sources if better lyrics don't have it. LRClib is wide but it's nowhere near as good as unison or better lyrics. there was a minor incident in the XML parser one time (yet again because of LLM slop, this time gpt luna is the perpetrator), and the whole pipeline failed silently. i updated it to parse XML normally instead of what mimo was doing but luna cuts down on the spaces in the spans, which in TTML means thelyricslooklikethis because they are split per word. i had around 865 TTMLs there, and i had to delete 330...... well i mean better here when i'm fucking around than when at a real job i suppose. 

i miss you gemini. i didn't realise you were so fast and was free.... all because google thought it was funny to give the whole wide world free gemini pro for a year. they blew 240 dollars per person in a year, it's crazy how they're not even short on inference right now. the gemini they're running just HAS to be running on their own TPUs instead of some nvidia weird shit.

## games page 
next up is the games page. at first it sounded simple, just copy what i already did at the music part, and like, add the games there myself right? no. very very wrong. well i mean, it could be right, but i didn't like that. i could have just embedded the steam store page there, but i wasn't really satisfied with that. i wanted something a little more. so i searched on how i can fetch data from steam and kinda dove into a little rabbit hole.

i ended up learning backend entirely on accident. i `Brainstormed` with gemini about how to approach this and ended up discovering about API requests. i already previously known about this, but my usage of it is like,
```bash
curl -s "example.com/api/v1/endpoint" | jq
```
so to actually pipe interpret it myself was quite the challenge... if it wasn't for Slopus 4.6 FUCK i kinda vibecoded it. not fully, but like, this one is significantly more `vibe` because i know quite a lot less about what it is than the other parts of the site. i will do my duty of studying JS in backend but tbh it's not as `vibe` as i say it is, just like, if were to be forced to rewrite it i wouldn't know what to do without google. most of the other places on this site i do at least know what it does. i only know that this one:
- fetches from steam on a couple of endpoints
- some endpoints can receive multiple inputs and covers multiple purposes
- some requests can't be batched, namely achievements and prices so it takes a lot of requests

i've read that steam only really limits me to 100k requests per day and that's it, but i don't want to take any risks. my `Brainstorming` session had me reinvent caching. i'm quite proud of this actually. unc is still able to think on his own despite vibecoding. 
my suggestion was to split the function into two. the functions themselves fetch the data and log the current time. the live readers now request fresh data on every page load rather than serving an intentionally stale snapshot.

gemini in its infinite wisdom suggested caching to me. after the euphoria of knowing i independently discovered caching settles down, i stopped and realized that caching would store this in RAM, which doesn't sound likely to something like netlify. the current implementation deliberately avoids HTTP response caching for live data: the reader functions are regular functions with no-store headers. Netlify Blobs can still take its documented propagation window to update every edge location.

so there it is. i **INDEPENDENTLY** thought about this btw. god idk why i'm so giddy about this, i need an ego check some time. 

# future plans
- animanga page
- moviseries page
- projects page
- personal blog (?)

i plan to incorporate an actual database in the future instead of hardcoding everything into the .jsx file, but for now this will have to do

### UPDATE - September 2026

like i said, netlify blobs should've been the way here. the site is mostly modular now, in fact VERY modular. luna made it way too modular but i can't be assed to burn more tokens for this, got bigger fish on my plate now. i'm reaching the end of my college year and funnily enough i understand way more about C and embedded systems more than i do web dev. thought i was safe from the ai job taking thing but astra just designed a pcb by itself. why can't astra just be fable?? why is it human 2?? just hire humans??? astra cost more than a human at this point. 

looking back though, i don't know why i was so "giddy" about discovering caching. i suppose i've just grown a lot in the past year and know much more about everything. it's not even the caching that i was discovering it was literally just a cdn service. like. that's how. everything works. omg. i've really did grow and change as a person, god damn.

---
*See, you're just wasted and thinking bout the past again,*
*Darling, you'll be okay.*

08/09/2026
