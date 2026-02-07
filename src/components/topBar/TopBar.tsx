// TopBar wraps the DecentBar with some props specific to the app. This TopBar component can be added to each screen of the app in a DRY way.
// For DecentBar docs, see "Using the DecentBar" at https://github.com/erikh2000/decent-portal .
import { DecentBar } from "decent-portal";

const appLinks = [
  { description: "Support", url: "https://github.com/DecentAppsNet/encounters/issues" }
];

const contributorText = 'Erik Hermansen';

function TopBar() {
  return <DecentBar appLinks={appLinks} contributorText={contributorText}/>
}

export default TopBar;