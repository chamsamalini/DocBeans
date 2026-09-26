import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { completedTopicPrefixLength } from '../lib/training-progress.ts';
import { professionalTrainingSubtitle } from '../lib/presentation-quality.ts';
import { hasStructuredCoreSequence, relevantSourceExcerpt, validateTrainingTopicQuality } from '../services/backend/generation/training-quality.ts';

const plan={title:'Course',topics:[
  {title:'Topic one',purpose:'Purpose one.',durationMinutes:45,outcomes:['Outcome one.']},
  {title:'Topic two',purpose:'Purpose two.',durationMinutes:60,outcomes:['Outcome two.']},
]};
const topicDocument=(title)=>({title,subtitle:'',sections:Array.from({length:4},(_,index)=>({title:`Slide ${index+1}`,summary:'Summary',bullets:['Point'],instructionalPurpose:index===0?'orient':index===1?'explain':index===2?'demonstrate':'apply',timingMinutes:5,facilitatorNotes:['Explain the evidence, ask one diagnostic question and connect the answer to the next slide.'],visual:{type:'none',title:'',description:'',sourceName:'',labels:[],values:[]},sourceRefs:[]})),sourcesUsed:[],requirementCoverage:[],quality:{score:90,status:'ready',checks:[],missingInformation:[]}});

assert.equal(completedTopicPrefixLength(plan,[topicDocument('Topic one')]),1,'A valid saved prefix should resume at the next topic.');
assert.equal(completedTopicPrefixLength(plan,[topicDocument('Changed topic')]),0,'Edited topics must invalidate saved progress.');
assert.equal(completedTopicPrefixLength(plan,[topicDocument('Topic one'),topicDocument('Topic two'),topicDocument('Extra')]),0,'Progress longer than the plan must reset.');
assert.equal(professionalTrainingSubtitle('45 minutes · Executive framing'),'Executive framing','Legacy topic subtitles must hide duration without losing their message.');
assert.equal(professionalTrainingSubtitle('45-minute executive framing'),'executive framing','Hyphenated duration prefixes must also be removed from visible subtitles.');
assert.equal(professionalTrainingSubtitle('Course plan for 5 hours'),'Professional training material','A duration-only course subtitle must fall back to professional visible copy.');

const trainingDocument=topicDocument('Topic one');
trainingDocument.sections=trainingDocument.sections.map((section,index)=>({...section,summary:'A source-specific message explains what experienced participants should understand and do in this part of the topic.',bullets:['Apply the supported decision criteria to a realistic semiconductor operating scenario.'],timingMinutes:10,facilitatorNotes:['Explain the source evidence and expert reasoning, ask participants to predict the consequence, address the likely misconception, then transition to the next decision.'],visual:index===1?{type:'matrix',title:'Decision matrix',description:'Compare two relevant choices',sourceName:'',labels:['Choice A','Choice B'],values:[]}:section.visual}));
assert.equal(validateTrainingTopicQuality(trainingDocument,{title:'Topic one',durationMinutes:45},false),'','A topic with a deliberate story arc, realistic timing and substantive notes should pass.');
assert.match(validateTrainingTopicQuality({...trainingDocument,sections:trainingDocument.sections.map(section=>({...section,facilitatorNotes:['Repeat the bullet.']}))},{title:'Topic one',durationMinutes:45},false),/facilitator notes/,'Thin facilitator notes must fail the topic quality gate.');
assert.match(validateTrainingTopicQuality({...trainingDocument,subtitle:'45 minutes · Executive framing'},{title:'Topic one',durationMinutes:45},false),/duration out of visible presentation headings/,'Visible topic headings must not expose delivery duration.');
assert.equal(hasStructuredCoreSequence({...trainingDocument,trainingModules:[{title:'One',subtitle:'',sections:trainingDocument.sections},{title:'Two',subtitle:'',sections:trainingDocument.sections}]}),true,'Structured demonstration and application roles must satisfy the assembled core-sequence check without relying on literal slide wording.');
assert.equal(hasStructuredCoreSequence({...trainingDocument,trainingModules:[{title:'One',subtitle:'',sections:trainingDocument.sections.map(section=>({...section,instructionalPurpose:'explain'}))}]}),false,'A topic without demonstration and application roles must not satisfy the structured sequence check.');

const excerpt=relevantSourceExcerpt('General background that does not discuss the requested operating decision in any useful detail.\n\nWafer yield governance requires a named owner, approved evidence and a repeatable escalation path for unresolved manufacturing decisions.',new Set(['wafer','yield','governance']),120);
assert.match(excerpt,/Wafer yield governance/,'Relevant source extraction should retain the highest-scoring evidence.');
assert.ok(excerpt.length<=120,'Relevant source extraction must respect the bounded context limit.');

const service=readFileSync(new URL('../services/backend/generation/advanced-service.ts',import.meta.url),'utf8');
const page=readFileSync(new URL('../app/create/page.tsx',import.meta.url),'utf8');
for(const marker of ["generationStage==='topic'","generationStage==='assemble'",'topic_limit_recovery','retry_compact_topic','completedTopicDocuments','topicSystem','systemOverride','courseOutcomeSections(coursePlan)','courseAgendaSections(coursePlan)','section.bullets.join','retry assembly without regenerating them','objectiveBullets','classify|compare|configure','measurable learning (?:objectives|outcomes)','assembled course begins with the approved measurable learning outcomes','requirements.length?(document.requirementCoverage','matchedModules.length>=Math.max','totalling ${totalMinutes} minutes','!/timed agenda|learning','relevantSourceExcerpt','instructionalBlueprint','validateTrainingTopicQuality','hasStructuredCoreSequence','facilitatorNotes','risk-map','never show duration or stage labels','one dominant evidence structure','subtitle:topic.purpose'])assert.ok(service.includes(marker),`Backend workflow marker missing: ${marker}`);
for(const marker of ["requestAdvancedGeneration('topic'","requestAdvancedGeneration('assemble'",'generationPayload','setCompletedTopicDocuments(completed)','Resume from topic','Assemble saved topics','Facilitator notes','Instructional purpose:','professionalTrainingSubtitle','Suggested timing:', 'timeline', 'architecture'])assert.ok(page.includes(marker),`Client workflow marker missing: ${marker}`);

console.log('Training topic resume and bounded-generation tests passed.');
