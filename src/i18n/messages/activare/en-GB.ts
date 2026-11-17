import type { ActivareCatalog } from "./ro";

export const enGBActivare: ActivareCatalog = {
  QuickStart: {
    title: "Add yourself, then your parents and grandparents",
    lead: "It takes a minute. Leave blank what you don’t know: add it later, or let your relatives help.",
    progress: "Step {n} of {total}",
    fatherSide: "Grandparents on your father’s side",
    motherSide: "Grandparents on your mother’s side",
    grandfatherGiven: "Grandfather’s first name",
    grandmotherGiven: "Grandmother’s first name",
    grandmotherMaiden: "Grandmother’s maiden name",
    dontKnow: "I don’t know, next",
    finish: "Done, make the tree",
    later: "Exact dates, photos and places can be added afterwards, from the tree.",
    otherWays: "Got a link from a relative or already have a GEDCOM file? You’ll find those options below.",
  },
  BranchInvite: {
    titleM: "Invite {name} to fill in his branch",
    titleF: "Invite {name} to fill in her branch",
    text: "Your tree already has {count} people. {name} knows names and stories nobody else knows: send the link on WhatsApp, by email or copy it.",
    later: "Later",
    viewOnly: "During the free days the link lets them see the tree; for {name} to write in it too, a paid year is needed.",
  },
  ActivationMail: {
    subject: "Your tree is waiting for you on {app}",
    body: "Hi {name}!\n\nYou made an account on {app}, but your tree hasn’t started yet. The first step is short: who you are, then your parents and grandparents, three lines per screen. Leave blank what you don’t know.\n\nFrom then on you can invite your relatives to fill in their own branches.",
    button: "Start the tree",
    why: "You’re getting this email once, because you made an account on {app}.",
    unsubscribe: "No more account emails",
  },
};
