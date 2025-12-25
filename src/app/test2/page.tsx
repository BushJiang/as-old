export default function Page() {
  return (
    <header className="w-full bg-blue-500 text-white p-4">
      {/* 2. 里面的 div (L2 布局层)：只负责限制宽度和居中 */}
      <div className="max-w-3xl mx-auto">
          Logo | 菜单
      </div>
    </header>
  );
}

