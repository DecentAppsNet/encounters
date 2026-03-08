// TopBar wraps the DecentBar with some props specific to the app. This TopBar component can be added to each screen of the app in a DRY way.
// For DecentBar docs, see "Using the DecentBar" at https://github.com/erikh2000/decent-portal .
import { DecentBar, defaultOnClickLink, Link, getAppMetaData, getAppSettings, AppSettingCategory, SettingType, BooleanToggleSetting } from "decent-portal";
import { useState, useEffect } from "react";

const appLinks = [
  { description: "About", url: 'ABOUT' },
  { description: "Support", url: "https://github.com/DecentAppsNet/encounters/issues" }
];

const contributorText = 'Erik Hermansen, Peter Turner, Eduardo Worrel';

type Props = {
  onAboutClick: Function
}

function TopBar({ onAboutClick }: Props) {
  const [defaultAppSettings, setDefaultAppSettings] = useState<AppSettingCategory | undefined>();

  useEffect(() => {
    async function init() {
      const appMetaData = await getAppMetaData();
      const defaultFamilyIsMediapipe = (appMetaData as any).inferenceFamily !== 'webllm';

      const inferenceFamilySetting: BooleanToggleSetting = {
        id: 'inferenceFamily',
        type: SettingType.BOOLEAN_TOGGLE,
        label: 'LLM family to use',
        value: defaultFamilyIsMediapipe,
        trueLabel: 'Mediapipe LiteRT-LM',
        falseLabel: 'WebLLM'
      };

      const customSettings: AppSettingCategory = {
        description: "These settings apply solely to Encounters, while other settings apply to all apps.",
        settings: [inferenceFamilySetting]
      };
      setDefaultAppSettings(customSettings);
    }
    init();
  }, []);

  function _onClickLink(link: Link) {
    if (link.url === 'ABOUT') {
      onAboutClick();
      return;
    }
    defaultOnClickLink(link);
  }

  function _onSaveAppSettings(newValues: Record<string, any>) {
    // If the user changed the inference family, force a reload to re-run init() and boot the new model family.
    // We don't have oldValues here, so we will just reload if inferenceFamily is present in newValues. Wait, this function receives all settings as newValues.
    // If we want to only reload on changes to inferenceFamily we can retrieve the old settings inside.
    getAppSettings().then(oldSettings => {
      if (!oldSettings || newValues['inferenceFamily'] !== oldSettings['inferenceFamily']) {
        window.location.reload();
      }
    });
    return null;
  }

  return <DecentBar
    appLinks={appLinks}
    contributorText={contributorText}
    onClickLink={_onClickLink}
    defaultAppSettings={defaultAppSettings}
    onSaveAppSettings={_onSaveAppSettings}
  />
}

export default TopBar;