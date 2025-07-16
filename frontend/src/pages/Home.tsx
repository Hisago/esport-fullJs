import AppLayout from "@/Layouts/AppLayout"

export default function Home() {
  return (
    <AppLayout currentPage="home">
      <div className="text-white">
        <h1 className="text-2xl font-bold mb-4">🎮 Sélectionne ton jeu</h1>
        <p className="text-gray-400">
          Commence par choisir un jeu dans la sidebar.
        </p>
      </div>
    </AppLayout>
  )
}
