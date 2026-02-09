import OkayDialog from "@/components/modalDialogs/OkayDialog";

const description = `This app lets you define a local-LLM-based character that you can talk with. ` +
  `You can give it instructions that are guided by logic and state. ` +
  `This definition of how the LLM-based character behaves is called an "Encounter". ` + 
  `Encounters can be imported and exported as files to share with other people.`;

type Props = {
  isOpen: boolean;
  onClose: () => void;
}

function AboutDialog({ isOpen, onClose }: Props) {
  return (
    <OkayDialog
      description={description}
      isOpen={isOpen}
      onOkay={onClose}
      title="About Encounters"
    />
  );
}

export default AboutDialog;