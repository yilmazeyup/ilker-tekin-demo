import { LOOKS, stylistById } from '@ilker/shared';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { TryOn } from '../components/TryOn';
import { useDemo } from '../state/demo';

/** Feature 2: colour (and a new cut) tried on your own photo. */
export default function ColourStudio() {
  const params = useLocalSearchParams<{ look?: string }>();
  const { saved, toggleSaved, setTryOn } = useDemo();
  const toast = useToast();
  const looks = LOOKS.filter((l) => l.service !== 'heren');
  return (
    <Screen back title="Kleur & kapsel passen" kicker="Pasruimte">
      <TryOn
        looks={looks}
        initialLook={params.look ?? 'copper-glow'}
        onSave={(id) => {
          if (!id) return;
          if (!saved.includes(id)) toggleSaved(id);
          setTryOn({ look: id, technique: 'heel' });
          const look = LOOKS.find((l) => l.id === id)!;
          toast(`${look.name} bewaard`, { text: `${stylistById(look.by).name} ziet hem bij je volgende afspraak.`, icon: 'heart' });
        }}
        onBook={(look) => router.push({ pathname: '/behandeling/[id]', params: { id: look.service } })}
      />
    </Screen>
  );
}
