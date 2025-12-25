export default function Page() {
  return (
    // 1. 造一个 Flex 环境，并且强制居中 (items-center)
    <div className="flex flex-col items-center w-full min-h-screen">
      
      {/* 2. 你的代码放在这里 */}
      {/* 只有 max-w，没有 w-full */}
      <div className="max-w-3xl w-full text-center bg-red-500">
        Logo | 菜单
      </div>

    </div>
  );
}