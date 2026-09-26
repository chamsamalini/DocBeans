import assert from 'node:assert/strict';
import { courseAgendaSections, courseOutcomeSections, coursePlanSchema, parseCoursePlan, topicSlideRange } from '../services/backend/generation/course-plan.ts';

assert.equal(coursePlanSchema.properties.topics.minItems,1,'Provider schema must use an Anthropic-supported minItems value.');
assert.equal('maxItems' in coursePlanSchema.properties.topics,false,'Provider schema must not use unsupported maxItems.');
assert.equal('maxItems' in coursePlanSchema.properties.topics.items.properties.outcomes,false,'Nested arrays must not use unsupported maxItems.');
assert.ok(coursePlanSchema.required.includes('subtitle'),'New course plans must include a polished audience-facing subtitle.');

const validPlan=parseCoursePlan({title:'AI literacy course',topics:[
  {title:'AI foundations',purpose:'Build a shared vocabulary.',durationMinutes:45,outcomes:['Explain core AI concepts.']},
  {title:'Agent creation',purpose:'Apply the concepts in a practical workflow.',durationMinutes:90,outcomes:['Create and test an agent.']},
]});
assert.equal(validPlan?.topics.length,2,'A valid two-topic plan should pass.');
assert.equal(validPlan?.subtitle,'Professional training material','Legacy saved plans without a subtitle must remain usable.');
assert.equal(parseCoursePlan({title:'Too short',topics:[validPlan?.topics[0]]}),null,'Application validation must reject a one-topic plan.');
assert.equal(parseCoursePlan({title:'Invalid timing',topics:[
  {title:'One',purpose:'Purpose one.',durationMinutes:0,outcomes:['Outcome one.']},
  {title:'Two',purpose:'Purpose two.',durationMinutes:30,outcomes:['Outcome two.']},
]}),null,'A plan with fewer than two valid timed topics should fail.');
assert.deepEqual(topicSlideRange(45),{minimum:5,maximum:7,compactMaximum:4},'A 45-minute topic should receive a bounded slide range.');
assert.deepEqual(topicSlideRange(180),{minimum:15,maximum:17,compactMaximum:14},'Long topics should remain bounded.');
const outcomeSections=courseOutcomeSections(validPlan);
assert.equal(outcomeSections.length,1,'Two concise outcomes should fit on one course-level outcomes slide.');
assert.match(outcomeSections[0].title,/Learning outcomes/,'Assembly must add an explicit course-level outcomes slide.');
assert.ok(outcomeSections.every(section=>section.bullets.length<=2),'Generated overview slides must keep enough headroom for the summary.');
assert.ok(outcomeSections.flatMap(section=>section.bullets).every(bullet=>bullet.split(/\s+/).length<=24),'Generated overview bullets must stay within the readability limit.');
assert.ok(outcomeSections.every(section=>`${section.summary} ${section.bullets.join(' ')}`.trim().split(/\s+/).length<=90),'Generated overview slides must pass the total-word readability limit.');
assert.ok(outcomeSections.every(section=>section.instructionalPurpose==='orient'&&section.facilitatorNotes.length&&section.timingMinutes>0),'Course overview slides must carry facilitator guidance and timing.');
const agendaSections=courseAgendaSections(validPlan);
assert.equal(agendaSections.length,1,'Two topics should fit on one timed-agenda slide.');
assert.deepEqual(agendaSections[0].bullets,['45 minutes — AI foundations','90 minutes — Agent creation'],'The agenda must preserve approved topic durations and order.');
assert.ok(agendaSections.every(section=>section.bullets.length<=4&&`${section.summary} ${section.bullets.join(' ')}`.trim().split(/\s+/).length<=90),'Generated agenda slides must pass readability limits.');

const densePlan=parseCoursePlan({title:'Dense course',topics:[
  {title:'One',purpose:'Purpose one.',durationMinutes:30,outcomes:['Explain the operating model and its implications for governed deployment across a complex organization with multiple teams and responsibilities.','Apply the approved process to a realistic business decision and record the evidence supporting every selected control and resulting action.','Evaluate the implementation risks and recommend proportionate mitigations that preserve accountability, traceability, usability and measurable operational value.']},
  {title:'Two',purpose:'Purpose two.',durationMinutes:30,outcomes:['Create a practical action plan with named owners, review milestones, measurable results and a clear escalation route for unresolved decisions.','Demonstrate the workflow using representative evidence and explain how each important step contributes to the intended organizational outcome.','Compare the available options and defend a preferred approach using transparent criteria, relevant constraints and the supplied source material.']},
]});
assert.ok(densePlan,'The dense readability fixture should be a valid course plan.');
const denseOutcomeSections=courseOutcomeSections(densePlan);
assert.equal(denseOutcomeSections.length,1,'The course overview should summarize one representative outcome per topic rather than repeating every detailed outcome.');
assert.ok(denseOutcomeSections.every(section=>`${section.summary} ${section.bullets.join(' ')}`.trim().split(/\s+/).length<=90),'Even long approved outcomes must produce readable overview slides.');

console.log('Course-plan validation tests passed.');
