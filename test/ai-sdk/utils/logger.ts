/**
 * 简单的日志工具
 */

export function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

export function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

export function logError(message: string, error?: any) {
  console.error(`❌ ${message}`);
  if (error) {
    console.error(error);
  }
}

export function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

export function logResponse(label: string, content: string) {
  console.log(`\n📝 ${label}:`);
  console.log('-'.repeat(60));
  console.log(content);
  console.log('-'.repeat(60));
}
