interface CustomListProps<T> {
  dataSource?: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  empty?: React.ReactNode;
  className?: string;
}

function CustomList<T>({ dataSource = [], renderItem, empty, className = '' }: CustomListProps<T>) {
  if (!dataSource.length) {
    return <div className="py-6 text-center">{empty}</div>;
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {dataSource.map((item, index) => (
        <div key={(item as any)?.id ?? index}>{renderItem(item, index)}</div>
      ))}
    </div>
  );
}

export default CustomList;
