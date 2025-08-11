# A couple of tools for doing bulk stuff on soundCloud pages

## downloader 

- lets you download all songs, that have a free download button, e.g. on a `/{account}/{track}/recommended` page 
- WIP, not working yet

run it with `npm run download -- {full ./{account}/{track}/recommended URL}`

## follower

- lets you follow all pages that another soundcloud account follows (`/{account}/following`)
- note that SoundCloud will block you from following more accounts for 5 days after 200 consecutive clicks 

run it with `npm run follow -- {full ./{account}/following URL}`

# TODOs

- fix downloader & follower
    - eventually puppeteer will click something that navigates the tab away from the current page
        - might use a selector and disable all `href`s 
- build a browser frontend