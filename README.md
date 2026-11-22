# Clearpath — Bankruptcy intake & screening

Live site: https://my-first-website-mu-two.vercel.app/

A responsive, private, survey-style educational bankruptcy intake for individuals, joint filers, sole proprietors, separate business entities and specialist matters. Replaces the former Chapter 11 Atlas dashboard; the earlier dashboard remains recoverable from Git history.

## Experience

Ten stages cover identity/type, jurisdiction, priorities, debts, income, assets, urgency, special circumstances, history and review. Results provide chapter discussion priorities, explain uncertainty, flag urgent issues and generate a text or printable attorney consultation summary. Individual and entity routes are distinct. The chapter comparison covers 7, 11, 12 and 13, and flags municipal, regulated and cross-border cases for specialist review.

This tool does not determine legal qualification, calculate a statutory means test, establish exemptions, apply all current debt ceilings, choose whether someone should file, prepare a petition or provide legal representation. Screening rules and official reference sources live in `intake/screening.js`. Reviewed November 22, 2026; laws and filing-date limits require ongoing review.

## Privacy and handoff

Answers remain in module memory in the current tab only. No analytics, remote fonts, intake API, cookies, localStorage, sessionStorage or answer-bearing URLs. No names, SSNs, account identifiers, email or uploads are requested. Downloads and printing happen only at the visitor's request. Ordinary hosting access logs may still exist. Reloading or leaving clears the intake; Clear answers also removes the rendered answer DOM.

The attorney handoff links to the ABA's attorney resources and LSC's civil legal-aid locator. No law firm destination was provided. Nothing is automatically sent or booked; visitors choose an attorney and how to share their own summary. To connect a particular firm later, obtain its verified destination and define consent and secure handling before adding data transmission or retention.

## Development

Static HTML/CSS/JavaScript; no runtime packages or build step. Serve this folder with a static server. `npm test` runs the screening tests. `npm run check` checks JavaScript syntax. Push main to the existing GitHub repository to trigger Vercel deployment.

Do not add sensitive intake logging, email submissions or third-party tracking without deliberately revising the privacy design and visitor disclosures. No credentials belong in this repository.
