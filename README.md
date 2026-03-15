# hellooooooo
okay so like, since you're this curious and you're checking out the source code:
  - this is a react + vite site
  - i strictly did NOT use tailwind because i'm trying to learn CSS here
  - it's deployed via netlify

`i guess i'll put what i learned here then, as kind of a journal or log`
---
# home page
in this page i just got started learning react, i was pretty shocked how close it is, or i guess the fact that it literally IS just HTML but with JS like, shoehorned deep through it somehow. everything just works as expected, and you can use variables within the HTML itself instead of having to hardcode everything like a static site. 

though i guess the home page is just a static site...

but hey at least the learning curve won't be that bad, i thought to myself. at this point i was still thinking that it would be a single page thing (well, it kinda did, but not really a SPA in the traditional sense). still though, most of this was developed from gemini's boilerplate. while i did understand how i should be doing something like this in the future, i don't think i can start off an empty `App.jsx` or something...
---
# music page
this is where things get FUN. when making the music segment i (thankfully) quickly realize i didn't have enough space to put what i comfortably want here. i thought about some scroll takeover shi but like, i thought that would be a little too advanced for me that just wanted to make a sorta non static portofolio-ish site. so, i just use react-router for this. i could have used next.js, but there's too much vercel branding for when i wanted that (also i LITERALLY switched from next to react-vite because i didn't like it that much. i'll inevitably have to learn it though...)

at first i thought, how would i kinda show the music right? like, i can't just say `oh yeah demi lovato's i will survive is so much better` or something without the song itself to back it up. so i actually first thought of youtube music, the one i actually use to listen to music. i also quickly realize that it didn't even want to play copyrighted songs and i just don't like it in the end. my next thought is actually spotify but i realize i can just use apple music...

so there goes, now i have apple music embeds on them. it does slow the page pretty significantly, but it's not netlify loading it, so i'm not really hitting my limits or getting billed over this. it's inefficient but whatever. not like i can just host the rip of the song directly here without getting nuked. (i WAS actually about to do that but like, very quickly realize how quickly they'd nuke my site especially with autodetection), hell i even wanted to display **LYRICS**, just for the few parts i actually like along with 10s of audio or something. but i guess it is what it is.
---
# games page 
next up is the games page. at first it sounded simple, just copy what i already did at the music part, and like, add the games there myself right? no. very very wrong. well i mean, it could be right, but i didn't like that. i could have just embedded the steam store page there, but i wasn't really satisfied with that. i wanted something a little more. so i searched on how i can fetch data from steam and kinda dove into a little rabbit hole.

i ended up learning backend entirely on accident. i `Brainstormed` with gemini about how to approach this and ended up discovering about API requests. i already previously known about this, but my usage of it is like,
```bash
curl -s "some.external.link.com/api/v1/endpoint" | jq
```
so to actually pipe interpret it myself was quite the challenge... if it wasn't for Slopus 4.6 FUCK i kinda vibecoded it. not fully, but like, this one is significantly more `vibe` because i know quite a lot less about what it is than the other parts of the site. i will do my duty of studying JS in backend but tbh it's not as `vibe` as i say it is, just like, if were to be forced to rewrite it i wouldn't know what to do without google. most of the other places on this site i do at least know what it does. i only know that this one:
- fetches from steam on a couple of endpoints
- some endpoints can receive multiple inputs and covers multiple purposes
- some requests can't be batched, namely achievements and prices so it takes a lot of requests

i've read that steam only really limits me to 100k requests per day and that's it, but i don't want to take any risks. my `Brainstorming` session had me reinvent caching. i'm quite proud of this actually. unc is still able to think on his own despite vibecoding. 
my suggestion was to split the function into two. the functions thmselves fetch the data and logs the current time. if a user reloads the page, which was my consideration, they will be served stale data from 5 minutes to 1 day ago depending on what that data is.
- play time is timed to 5 minutes
- profile decor (yes those are actually dynamic on my site and you can request the CDN link directly from their API), achievements, and prices update every 1 day.
gemini in its infinite wisdom suggested caching to me. after the euphoria of knowing i independently discovered caching settles down, i stopped and realized that caching would store this in RAM, which doesn't sound likely to something like netlify. so i looked it up, and there's apparently something called `On-Demand Builders` or whatever the hell. apparently it does exactly what i proposed, set a `time to live` header on their data, and it will serve that data instead. it does count as a CDN, but it's just a couple of JSONs i don't really mind having to serve from my bandwidth for this. 

so there it is. i **INDEPENDENTLY** thought about this btw. god idk why i'm so giddy about this, i need an ego check some time. 
---
# future plans
- anime page
- movies page
- projects page
- personal blog (?)

i plan to incorporate an actual database in the future instead of hardcoding everything into the .jsx file, but for now this will have to do

---
Merry Muslim Christmas!
15/03/2026
