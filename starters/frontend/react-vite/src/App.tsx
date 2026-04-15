export default function App() {
  const title =
    import.meta.env.VITE_APP_TITLE ?? "dFlow React (Vite) starter";
  return <h1>{title}</h1>;
}
