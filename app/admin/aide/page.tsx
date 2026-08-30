import { HelpCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const sections = [
  { num: '1', title: 'Connexion', body: 'Connectez-vous avec votre adresse email et votre mot de passe sur la page de connexion. Vous accédez ensuite à votre espace auteur.' },
  { num: '2', title: 'Créer un article', body: 'Cliquez sur « Nouvel article » depuis votre tableau de bord. L\'article est automatiquement créé en statut brouillon et vous est attribué.' },
  { num: '3', title: 'Ajouter une image', body: 'Dans l\'éditeur, utilisez la section « Image principale » pour téléverser une photo. Vous pouvez ajouter une légende et un crédit. Dans le contenu, utilisez le bloc « Image ».' },
  { num: '4', title: 'Rédiger', body: 'Utilisez les blocs modulaires (texte, titre, citation, chiffres clés, chronologie, etc.) pour structurer votre article. Réorganisez-les avec les flèches haut/bas.' },
  { num: '5', title: 'Sauvegarder', body: 'L\'enregistrement est automatique : « Enregistrement… » puis « ✓ Enregistré » s\'affiche en haut de la page. Vous pouvez aussi cliquer sur « Enregistrer ».' },
  { num: '6', title: 'Prévisualiser', body: 'Cliquez sur « Prévisualiser » pour voir votre article tel qu\'il apparaîtra publiquement. Vous pouvez aussi ouvrir la preview dans un nouvel onglet.' },
  { num: '7', title: 'Soumettre', body: 'Quand votre article est prêt, cliquez sur « Soumettre à la rédaction ». L\'article passe en statut « En validation ». Vérifiez que le titre, la rubrique, l\'auteur et le contenu sont renseignés.' },
  { num: '8', title: 'Corrections', body: 'Si la rédaction demande des corrections, un message s\'affiche en haut de l\'éditeur. Modifiez votre article puis cliquez sur « Resoumettre à la rédaction ».' },
  { num: '9', title: 'Publication', body: 'La rédaction valide puis publie votre article. Vous ne pouvez pas publier vous-même. Une fois publié, l\'article est visible sur le site public.' },
  { num: '10', title: 'Modifier un article', body: 'Retournez sur « Mes articles » pour retrouver vos contenus. Vous pouvez modifier vos brouillons et articles en correction. Les articles publiés ne peuvent être modifiés que par la rédaction.' },
];

export default function AidePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HelpCircle className="h-6 w-6 text-neutral-400" strokeWidth={1.5} />
        <div>
          <h2 className="font-display text-2xl font-bold text-neutral-800">Guide de l'auteur</h2>
          <p className="mt-1 text-sm text-neutral-500">Tout ce qu'il faut savoir pour rédiger et publier.</p>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((s) => (
          <div key={s.num} className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-white">{s.num}</span>
              <div>
                <h3 className="font-display text-base font-semibold text-neutral-800">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{s.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
