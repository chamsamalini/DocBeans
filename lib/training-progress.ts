import type { AdvancedDocument, CoursePlan } from './job-generation';

export function completedTopicPrefixLength(plan:CoursePlan,documents:AdvancedDocument[]){
  if(documents.length>plan.topics.length)return 0;
  return documents.every((document,index)=>document.title===plan.topics[index]?.title&&Array.isArray(document.sections)&&document.sections.length>=4)?documents.length:0;
}
