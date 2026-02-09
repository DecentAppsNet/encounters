// TopBar wraps the DecentBar with some props specific to the app. This TopBar component can be added to each screen of the app in a DRY way.
// For DecentBar docs, see "Using the DecentBar" at https://github.com/erikh2000/decent-portal .
import { DecentBar, defaultOnClickLink, Link } from "decent-portal";

const appLinks = [
  { description: "About", url: 'ABOUT' },
  { description: "Support", url: "https://github.com/DecentAppsNet/encounters/issues" }
];

const contributorText = 'Erik Hermansen';

type Props = {
  onAboutClick:Function
}

function TopBar({onAboutClick}:Props) {
  function _onClickLink(link:Link) {
    if (link.url === 'ABOUT') {
      onAboutClick();
      return;
    }
    defaultOnClickLink(link);
  }
  
  return <DecentBar appLinks={appLinks} contributorText={contributorText} onClickLink={_onClickLink}/>
}

export default TopBar;