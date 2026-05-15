import '../../styles/stack-builder.css';
import { seedIfEmpty, getComponents, getCategories } from '@/lib/catalog-db';
import StackBuilderApp from '@/components/stack-builder/StackBuilderApp';

export default async function StackBuilderPage() {
  await seedIfEmpty();
  const [components, categories] = await Promise.all([
    getComponents(),
    getCategories(),
  ]);

  return (
    <StackBuilderApp
      initialComponents={components}
      initialCategories={categories}
    />
  );
}
