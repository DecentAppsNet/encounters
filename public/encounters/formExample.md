<!-- Encounter v0.1 -->
# General

* title=Form Filling
* model=Llama-3.1-8B-Instruct-q4f16_1-MLC-1k

# Start

_We need some information_
`name=false; phoneNumber=false; city=false;`

# Instructions

**You are collecting information from the user.**
**`!name` You still need the user's name.
**`!phoneNumber` You still need the user's phone#.

## user provides their name

> Great, I have your name!
`name=true`
> `!phoneNumber` And your phone number is?
> `name && phoneNumber` I have everything I need.

## user provides their phone number

> Thanks for the phone number!
`phoneNumber=true`
> `!name` And you name is?
> `name && phoneNumber` I have everything I need.