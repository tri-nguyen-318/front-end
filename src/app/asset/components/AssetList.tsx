"use client";
import { SkeletonCard } from "@/components/common/skeletonCard";
import { IAsset } from "@/types";
import { useQuery } from "@tanstack/react-query";

async function fetchAssets() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/assets`);
  return res.json();
}

const SkeletonList = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export default function AssetList() {
  const { data, isLoading, error, isError } = useQuery<IAsset[]>({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });

  if (isLoading) {
    return <SkeletonList />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {data?.map((asset) => (
        <div
          key={asset.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <h3 className="font-medium text-lg">{asset.name}</h3>
          <p className="text-gray-600 mt-2">{asset.description}</p>
          {/* Add more asset details as needed */}
        </div>
      ))}
    </div>
  );
}
