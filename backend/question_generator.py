import openai
import random
import json
from typing import List, Dict, Tuple
from dataclasses import dataclass
from enum import Enum
import re
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.tag import pos_tag
import spacy
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import os
# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
    nltk.download('stopwords', quiet=True)
except:
    print("NLTK downloads failed. Some features may not work.")

class TaxonomyLevel(Enum):
    REMEMBER = "remember"
    UNDERSTAND = "understand"
    APPLY = "apply"
    ANALYZE = "analyze"
    EVALUATE = "evaluate"
    CREATE = "create"

class DifficultyLevel(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

@dataclass
class Question:
    question: str
    answer: str
    taxonomy_level: TaxonomyLevel
    difficulty: DifficultyLevel
    question_type: str
    context_snippet: str

class QuestionGenerator:
    def __init__(self, use_openai=False, openai_api_key=None):
        """
        Initialize the question generator.
        
        Args:
            use_openai (bool): Whether to use OpenAI API for question generation
            openai_api_key (str): OpenAI API key if using OpenAI
        """
        self.use_openai = use_openai
        
        # Set OpenAI API key with priority: parameter > environment variable
        if use_openai:
            # First try to use the provided API key
            if openai_api_key:
                openai.api_key = openai_api_key
            # Then try to get it from environment variable
            else:
                env_api_key = os.environ.get("OPENAI_KEY")
                if env_api_key:
                    openai.api_key = env_api_key
                else:
                    print("Warning: OpenAI API key not provided. OpenAI features will not work.")
                    print("Set OPENAI_KEY environment variable or pass openai_api_key parameter.")
                    self.use_openai = False
        
        # Check for deprecated OpenAI API usage
        try:
            import warnings
            warnings.filterwarnings("ignore", category=DeprecationWarning)
            # Set API type to avoid some warnings
            openai.api_type = "open_ai"
        except Exception as e:
            print(f"Note: Could not configure OpenAI warnings: {e}")
        
        # Initialize transformers models for local ML-based generation
        self.init_models()
        
        # Taxonomy-specific question templates and patterns
        self.taxonomy_templates = {
            TaxonomyLevel.REMEMBER: {
                "templates": [
                    "What is {}?",
                    "Define {}.",
                    "List the main {} mentioned in the text.",
                    "Who is {}?",
                    "When did {} occur?",
                    "Where does {} take place?"
                ],
                "keywords": ["what", "who", "when", "where", "list", "define", "identify"]
            },
            TaxonomyLevel.UNDERSTAND: {
                "templates": [
                    "Explain the concept of {}.",
                    "How does {} work?",
                    "What is the significance of {}?",
                    "Describe the relationship between {} and {}.",
                    "Summarize the main idea about {}."
                ],
                "keywords": ["explain", "describe", "summarize", "interpret", "classify"]
            },
            TaxonomyLevel.APPLY: {
                "templates": [
                    "How would you use {} in a real-world scenario?",
                    "Apply the concept of {} to solve this problem: {}",
                    "What would happen if {} was implemented in {}?",
                    "Demonstrate how {} can be applied to {}."
                ],
                "keywords": ["apply", "demonstrate", "use", "implement", "solve"]
            },
            TaxonomyLevel.ANALYZE: {
                "templates": [
                    "Compare and contrast {} and {}.",
                    "What are the causes of {}?",
                    "Analyze the relationship between {} and {}.",
                    "Break down the components of {}.",
                    "What patterns can you identify in {}?"
                ],
                "keywords": ["analyze", "compare", "contrast", "examine", "investigate"]
            },
            TaxonomyLevel.EVALUATE: {
                "templates": [
                    "Evaluate the effectiveness of {}.",
                    "What are the strengths and weaknesses of {}?",
                    "Justify your opinion about {}.",
                    "Assess the impact of {} on {}.",
                    "Which approach is better: {} or {}? Explain."
                ],
                "keywords": ["evaluate", "assess", "judge", "critique", "justify"]
            },
            TaxonomyLevel.CREATE: {
                "templates": [
                    "Design a new approach to {}.",
                    "Create a plan for implementing {}.",
                    "Propose an alternative solution to {}.",
                    "Develop a strategy for {}.",
                    "Construct an argument for {}."
                ],
                "keywords": ["create", "design", "develop", "construct", "propose"]
            }
        }
    
    def init_models(self):
        """Initialize ML models for question generation."""
        try:
            # Load spaCy model for NLP processing
            self.nlp = spacy.load("en_core_web_sm")
        except:
            print("spaCy model not found. Installing...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            self.nlp = spacy.load("en_core_web_sm")
        
        # Initialize question generation pipeline
        try:
            self.qg_model = pipeline(
                "text2text-generation",
                model="valhalla/t5-base-qg-hl",
                tokenizer="valhalla/t5-base-qg-hl"
            )
        except Exception as err:
            print(err)
            print("Question generation model not available. Using template-based generation.")
            self.qg_model = None
    
    def extract_key_entities(self, text: str) -> List[str]:
        """Extract key entities and concepts from text."""
        doc = self.nlp(text)
        entities = []
        
        # Extract named entities
        for ent in doc.ents:
            if ent.label_ in ["PERSON", "ORG", "GPE", "EVENT", "PRODUCT", "WORK_OF_ART"]:
                entities.append(ent.text)
        
        # Extract important noun phrases
        for chunk in doc.noun_chunks:
            if len(chunk.text.split()) <= 3 and chunk.root.pos_ == "NOUN":
                entities.append(chunk.text)
        
        return list(set(entities))
    
    def extract_key_concepts(self, text: str) -> List[str]:
        """Extract key concepts using POS tagging and frequency analysis."""
        words = word_tokenize(text.lower())
        pos_tags = pos_tag(words)
        stop_words = set(stopwords.words('english'))
        
        # Extract nouns and adjectives
        concepts = []
        for word, pos in pos_tags:
            if pos.startswith('NN') or pos.startswith('JJ'):
                if word not in stop_words and len(word) > 2:
                    concepts.append(word)
        
        # Return most frequent concepts
        from collections import Counter
        concept_freq = Counter(concepts)
        return [concept for concept, _ in concept_freq.most_common(10)]
    
    def generate_ml_questions(self, context: str, num_questions: int = 3) -> List[str]:
        """Generate questions using ML model."""
        if not self.qg_model:
            return []
        
        try:
            # Prepare input for the model
            input_text = f"generate question: {context}"
            
            # Generate questions
            results = self.qg_model(
                input_text,
                max_length=100,
                num_return_sequences=num_questions,
                temperature=0.7
            )
            
            questions = [result['generated_text'] for result in results]
            return questions
        except Exception as e:
            print(f"ML question generation failed: {e}")
            return []
    
    def generate_template_questions(self, context: str, taxonomy_level: TaxonomyLevel, 
                                  difficulty: DifficultyLevel, num_questions: int = 2) -> List[Dict]:
        """Generate questions using templates based on taxonomy level."""
        entities = self.extract_key_entities(context)
        concepts = self.extract_key_concepts(context)
        
        templates = self.taxonomy_templates[taxonomy_level]["templates"]
        questions = []
        
        for _ in range(num_questions):
            template = random.choice(templates)
            
            # Fill template with extracted entities/concepts
            if "{}" in template:
                # Count the number of placeholders in the template
                placeholder_count = template.count('{}')
                
                if placeholder_count == 1:
                    # Single placeholder template
                    if entities:
                        entity = random.choice(entities)
                        question_text = template.format(entity)
                    elif concepts:
                        concept = random.choice(concepts)
                        question_text = template.format(concept)
                    else:
                        # Fallback to generic question
                        question_text = template.replace("{}", "the main concept")
                else:
                    # Multiple placeholder template
                    if len(entities) >= placeholder_count:
                        # Use different entities for each placeholder
                        selected_entities = random.sample(entities, placeholder_count)
                        question_text = template.format(*selected_entities)
                    elif len(concepts) >= placeholder_count:
                        # Use different concepts for each placeholder
                        selected_concepts = random.sample(concepts, placeholder_count)
                        question_text = template.format(*selected_concepts)
                    else:
                        # Not enough entities or concepts, use a simpler template
                        simpler_templates = [t for t in templates if t.count('{}') <= 1]
                        if simpler_templates:
                            template = random.choice(simpler_templates)
                            if "{}" in template:
                                question_text = template.format("the main concept")
                            else:
                                question_text = template
                        else:
                            # Fallback to a very simple question
                            question_text = f"Explain the main concepts in the text related to {taxonomy_level.value}."
            else:
                question_text = template
            
            # Generate answer based on context and question
            answer = self.generate_answer(context, question_text, taxonomy_level)
            
            questions.append({
                "question": question_text,
                "answer": answer,
                "taxonomy_level": taxonomy_level,
                "difficulty": difficulty,
                "question_type": self.get_question_type(question_text),
                "context_snippet": self.get_relevant_context(context, question_text)
            })
        
        return questions
    
    def generate_answer(self, context: str, question: str, taxonomy_level: TaxonomyLevel) -> str:
        """Generate answer based on context and question type."""
        # Simple answer generation based on taxonomy level
        sentences = sent_tokenize(context)
        
        if taxonomy_level == TaxonomyLevel.REMEMBER:
            # For factual questions, find the most relevant sentence
            question_words = set(word_tokenize(question.lower()))
            best_sentence = ""
            max_overlap = 0
            
            for sentence in sentences:
                sentence_words = set(word_tokenize(sentence.lower()))
                overlap = len(question_words.intersection(sentence_words))
                if overlap > max_overlap:
                    max_overlap = overlap
                    best_sentence = sentence
            
            return best_sentence if best_sentence else sentences[0]
        
        elif taxonomy_level == TaxonomyLevel.UNDERSTAND:
            # For understanding questions, provide explanation
            relevant_sentences = sentences[:2]  # First two sentences as explanation
            return " ".join(relevant_sentences)
        
        elif taxonomy_level in [TaxonomyLevel.APPLY, TaxonomyLevel.ANALYZE]:
            # For higher-order questions, provide analytical answer
            return f"Based on the context: {' '.join(sentences[:3])}. This requires analysis of the given information and application of relevant concepts."
        
        else:  # EVALUATE, CREATE
            # For evaluation and creation questions
            return f"This question requires critical thinking and evaluation. Consider the following context: {' '.join(sentences[:2])} and formulate your response based on evidence and reasoning."
    
    def get_question_type(self, question: str) -> str:
        """Determine question type based on question text."""
        question_lower = question.lower()
        
        if question_lower.startswith(('what', 'who', 'when', 'where', 'which')):
            return "Factual"
        elif question_lower.startswith(('how', 'why')):
            return "Explanatory"
        elif question_lower.startswith(('compare', 'analyze', 'evaluate')):
            return "Analytical"
        elif question_lower.startswith(('create', 'design', 'develop')):
            return "Creative"
        else:
            return "General"
    
    def get_relevant_context(self, context: str, question: str, max_length: int = 200) -> str:
        """Extract most relevant context snippet for the question."""
        sentences = sent_tokenize(context)
        question_words = set(word_tokenize(question.lower()))
        
        # Find most relevant sentences
        sentence_scores = []
        for sentence in sentences:
            sentence_words = set(word_tokenize(sentence.lower()))
            overlap = len(question_words.intersection(sentence_words))
            sentence_scores.append((sentence, overlap))
        
        # Sort by relevance and take top sentences
        sentence_scores.sort(key=lambda x: x[1], reverse=True)
        relevant_text = " ".join([s[0] for s in sentence_scores[:2]])
        
        # Truncate if too long
        if len(relevant_text) > max_length:
            relevant_text = relevant_text[:max_length] + "..."
        
        return relevant_text
    
    def generate_openai_questions(self, context: str, taxonomy_level: TaxonomyLevel, 
                                difficulty: DifficultyLevel, num_questions: int = 2) -> List[Dict]:
        """Generate questions using OpenAI API."""
        if not self.use_openai:
            return []
        
        prompt = f"""
        Generate {num_questions} questions based on the following context. 
        
        Requirements:
        - Taxonomy Level: {taxonomy_level.value}
        - Difficulty: {difficulty.value}
        - Include both question and detailed answer
        - Make questions specific to the context
        - IMPORTANT: Each question and answer must be unique and different from others
        - Vary the question formats and answer structures
        
        Context: {context}
        
        Format your response as JSON with the following structure:
        {{
            "questions": [
                {{
                    "question": "Question text here",
                    "answer": "Detailed answer here"
                }}
            ]
        }}
        """
        try:
            # Use higher temperature for more diversity
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.9,  # Increased for more diversity
                max_tokens=1500,  # Increased to allow for more detailed answers
                presence_penalty=0.6,  # Encourages model to introduce new concepts
                frequency_penalty=0.6  # Discourages repetition
            )
            
            # Parse the response
            try:
                result = json.loads(response.choices[0].message.content)
                questions = []
                # Track answers to ensure diversity
                seen_answers = set()
                seen_questions = set()
                
                for q in result.get("questions", []):
                    question_text = q.get("question", "").strip()
                    answer_text = q.get("answer", "").strip()
                    
                    # Skip empty or duplicate questions/answers
                    if not question_text or not answer_text:
                        continue
                    
                    # Check for near-duplicates (simplified check)
                    if question_text in seen_questions:
                        continue
                    
                    # Check if answer is too similar to previous ones
                    if any(self._text_similarity(answer_text, prev) > 0.8 for prev in seen_answers):
                        continue
                    
                    # Add to tracking sets
                    seen_questions.add(question_text)
                    seen_answers.add(answer_text)
                    
                    questions.append({
                        "question": question_text,
                        "answer": answer_text,
                        "taxonomy_level": taxonomy_level,
                        "difficulty": difficulty,
                        "question_type": self.get_question_type(question_text),
                        "context_snippet": self.get_relevant_context(context, question_text)
                    })
                
                # If we didn't get enough diverse questions, log a warning
                if len(questions) < num_questions:
                    print(f"Warning: Only generated {len(questions)} diverse questions out of {num_questions} requested")
                
                return questions
            except json.JSONDecodeError as json_err:
                print(f"Error parsing OpenAI response: {json_err}")
                print(f"Raw response: {response.choices[0].message.content}")
                return []
        
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return []
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """Simple text similarity measure to detect near-duplicate answers."""
        # Convert to sets of words for a simple Jaccard similarity
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        # Jaccard similarity: intersection over union
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
    
    def generate_openai_question_set(self, context: str, taxonomy_difficulty_counts: List[Dict], 
                                   subject: str, topic: str = None) -> List[Dict]:
        """Generate multiple questions with different taxonomy and difficulty levels in a single OpenAI API call.
        
        Args:
            context (str): The source text/context
            taxonomy_difficulty_counts (List[Dict]): List of dictionaries with taxonomy_level, difficulty, and count
            subject (str): The subject name
            topic (str, optional): The topic name
            
        Returns:
            List[Dict]: List of generated questions with their details
        """
        if not self.use_openai:
            return []
        
        # Create a detailed prompt for OpenAI to generate all questions at once
        prompt = f"""
        Generate questions based on the following context.
        
        Context: {context}
        
        Generate questions with the following specifications:
        """
        
        # Add specifications for each combination
        for spec in taxonomy_difficulty_counts:
            taxonomy_level = spec['taxonomy_level']
            difficulty = spec['difficulty']
            count = spec['count']
            
            prompt += f"""
        - {count} questions with:
          - Taxonomy Level: {taxonomy_level.value}
          - Difficulty: {difficulty.value}
            """
        
        prompt += """
        Requirements for all questions:
        - Include both question and detailed answer
        - Make questions specific to the context
        - IMPORTANT: Each question and answer must be unique and different from others
        - Vary the question formats and answer structures
        
        Format your response as JSON with the following structure:
        {
            "questions": [
                {
                    "question": "Question text here",
                    "answer": "Detailed answer here",
                    "taxonomy_level": "taxonomy level value",
                    "difficulty": "difficulty level value"
                }
            ]
        }
        """
        
        try:
            # Use higher temperature for more diversity
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.9,  # Increased for more diversity
                max_tokens=4000,  # Increased to allow for more questions and detailed answers
                presence_penalty=0.6,  # Encourages model to introduce new concepts
                frequency_penalty=0.6  # Discourages repetition
            )
            
            # Parse the response
            try:
                result = json.loads(response.choices[0].message.content)
                questions = []
                # Track answers to ensure diversity
                seen_answers = set()
                seen_questions = set()
                
                for q in result.get("questions", []):
                    question_text = q.get("question", "").strip()
                    answer_text = q.get("answer", "").strip()
                    taxonomy_value = q.get("taxonomy_level", "").strip()
                    difficulty_value = q.get("difficulty", "").strip()
                    
                    # Skip empty or duplicate questions/answers
                    if not question_text or not answer_text:
                        continue
                    
                    # Check for near-duplicates (simplified check)
                    if question_text in seen_questions:
                        continue
                    
                    # Check if answer is too similar to previous ones
                    if any(self._text_similarity(answer_text, prev) > 0.8 for prev in seen_answers):
                        continue
                    
                    # Convert string values to enum if valid
                    try:
                        taxonomy_enum = TaxonomyLevel(taxonomy_value)
                    except ValueError:
                        # Find the closest matching taxonomy level
                        for level in TaxonomyLevel:
                            if level.value in taxonomy_value.lower():
                                taxonomy_enum = level
                                break
                        else:
                            # Default to UNDERSTAND if no match
                            taxonomy_enum = TaxonomyLevel.UNDERSTAND
                    
                    try:
                        difficulty_enum = DifficultyLevel(difficulty_value)
                    except ValueError:
                        # Find the closest matching difficulty level
                        for level in DifficultyLevel:
                            if level.value in difficulty_value.lower():
                                difficulty_enum = level
                                break
                        else:
                            # Default to MEDIUM if no match
                            difficulty_enum = DifficultyLevel.MEDIUM
                    
                    # Add to tracking sets
                    seen_questions.add(question_text)
                    seen_answers.add(answer_text)
                    
                    questions.append({
                        "question": question_text,
                        "answer": answer_text,
                        "taxonomy_level": taxonomy_enum,
                        "difficulty": difficulty_enum,
                        "question_type": self.get_question_type(question_text),
                        "context_snippet": self.get_relevant_context(context, question_text),
                        "subject": subject,
                        "topic": topic
                    })
                
                # If we didn't get enough diverse questions, log a warning
                total_requested = sum(spec['count'] for spec in taxonomy_difficulty_counts)
                if len(questions) < total_requested:
                    print(f"Warning: Only generated {len(questions)} diverse questions out of {total_requested} requested")
                
                return questions
            except json.JSONDecodeError as json_err:
                print(f"Error parsing OpenAI response: {json_err}")
                print(f"Raw response: {response.choices[0].message.content}")
                return []
        
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return []
    
    def generate_question_set(self, context: str, subject: str, topic: str = None, 
                           taxonomy_levels: List[str] = None, difficulty_levels: List[str] = None, 
                           num_questions: int = 10) -> List[Dict]:
        """
        Generate a set of questions based on the given parameters.
        
        Args:
            context (str): The source text/context
            subject (str): The subject name
            topic (str, optional): The topic name
            taxonomy_levels (List[str]): List of taxonomy levels to include
            difficulty_levels (List[str]): List of difficulty levels to include
            num_questions (int): Number of questions to generate
            
        Returns:
            List[Dict]: List of generated questions with their details
        """
        # Default values if not provided
        if not taxonomy_levels:
            taxonomy_levels = [level.value for level in TaxonomyLevel]
        
        if not difficulty_levels:
            difficulty_levels = [level.value for level in DifficultyLevel]
        
        # Convert string levels to enum values
        taxonomy_enums = [TaxonomyLevel(level) for level in taxonomy_levels]
        difficulty_enums = [DifficultyLevel(level) for level in difficulty_levels]
        
        # Distribute questions evenly across taxonomy and difficulty levels
        questions_per_combo = max(1, num_questions // (len(taxonomy_enums) * len(difficulty_enums)))
        remaining_questions = num_questions - (questions_per_combo * len(taxonomy_enums) * len(difficulty_enums))
        
        # If using OpenAI, prepare the specifications for a single API call
        if self.use_openai:
            taxonomy_difficulty_counts = []
            
            # Create specifications for each combination
            for taxonomy_level in taxonomy_enums:
                for difficulty in difficulty_enums:
                    # Determine how many questions to generate for this combination
                    count = questions_per_combo
                    if remaining_questions > 0:
                        count += 1
                        remaining_questions -= 1
                    
                    # Skip if no questions to generate
                    if count <= 0:
                        continue
                    
                    taxonomy_difficulty_counts.append({
                        'taxonomy_level': taxonomy_level,
                        'difficulty': difficulty,
                        'count': count
                    })
            
            # Generate all questions in a single API call
            all_questions = self.generate_openai_question_set(
                context, taxonomy_difficulty_counts, subject, topic
            )
            
            # If OpenAI generation failed, fall back to template-based generation
            if not all_questions:
                all_questions = self._generate_questions_with_templates(
                    context, subject, topic, taxonomy_enums, difficulty_enums,
                    questions_per_combo, remaining_questions
                )
        else:
            # Use template-based generation
            all_questions = self._generate_questions_with_templates(
                context, subject, topic, taxonomy_enums, difficulty_enums,
                questions_per_combo, remaining_questions
            )
        
        # Format questions for API response
        formatted_questions = []
        for q in all_questions:
            formatted_questions.append({
                "question": q["question"],
                "answer": q["answer"],
                "taxonomy_level": q["taxonomy_level"].value,
                "difficulty": q["difficulty"].value,
                "question_type": q["question_type"],
                "subject": q["subject"],
                "topic": q.get("topic", None)
            })
        
        return formatted_questions
    
    def _generate_questions_with_templates(self, context, subject, topic, taxonomy_enums, difficulty_enums,
                                        questions_per_combo, remaining_questions):
        """Helper method to generate questions using templates."""
        all_questions = []
        
        # Generate questions for each combination of taxonomy and difficulty
        for taxonomy_level in taxonomy_enums:
            for difficulty in difficulty_enums:
                # Determine how many questions to generate for this combination
                count = questions_per_combo
                if remaining_questions > 0:
                    count += 1
                    remaining_questions -= 1
                
                # Skip if no questions to generate
                if count <= 0:
                    continue
                
                # Generate questions using templates
                generated_questions = self.generate_template_questions(
                    context, taxonomy_level, difficulty, count
                )
                
                # Add subject and topic information
                for q in generated_questions:
                    q["subject"] = subject
                    if topic:
                        q["topic"] = topic
                
                all_questions.extend(generated_questions)
        
        return all_questions
    
    def generate_question_paper(self, context: str, specifications: Dict) -> Dict:
        """
        Generate a complete question paper based on specifications.
        
        Args:
            context (str): The source text/context
            specifications (dict): Question paper specifications
            
        Returns:
            dict: Complete question paper with questions and answers
        """
        question_paper = {
            "title": specifications.get("title", "Generated Question Paper"),
            "instructions": specifications.get("instructions", "Answer all questions based on the given context."),
            "total_marks": 0,
            "questions": [],
            "answer_key": []
        }
        
        # If using OpenAI, prepare the specifications for a single API call
        if self.use_openai:
            taxonomy_difficulty_counts = []
            
            # Create specifications for each specification
            for spec in specifications.get("question_specs", []):
                taxonomy_level = TaxonomyLevel(spec["taxonomy_level"])
                difficulty = DifficultyLevel(spec["difficulty"])
                count = spec.get("count", 2)
                marks = spec.get("marks", 5)
                
                taxonomy_difficulty_counts.append({
                    'taxonomy_level': taxonomy_level,
                    'difficulty': difficulty,
                    'count': count,
                    'marks': marks
                })
            
            # Generate all questions in a single API call
            subject = specifications.get("subject", "General Knowledge")
            topic = specifications.get("topic", None)
            
            all_questions = self.generate_openai_question_set(
                context, taxonomy_difficulty_counts, subject, topic
            )
            
            # If OpenAI generation failed or not enough questions, fall back to template-based generation
            if not all_questions:
                all_questions = self._generate_questions_for_paper_with_templates(
                    context, specifications
                )
            else:
                # Add marks information to questions
                for q in all_questions:
                    # Find the matching specification to get marks
                    for spec in taxonomy_difficulty_counts:
                        if (q["taxonomy_level"] == spec["taxonomy_level"] and 
                            q["difficulty"] == spec["difficulty"]):
                            q["marks"] = spec["marks"]
                            break
                    else:
                        # Default marks if no match found
                        q["marks"] = 5
        else:
            # Use template-based generation
            all_questions = self._generate_questions_for_paper_with_templates(
                context, specifications
            )
        
        # Add questions to paper
        for i, q in enumerate(all_questions):
            question_num = i + 1
            marks = q.get("marks", 5)
            
            question_entry = {
                "question_number": question_num,
                "question": q["question"],
                "marks": marks,
                "taxonomy_level": q["taxonomy_level"].value,
                "difficulty": q["difficulty"].value
            }
            
            answer_entry = {
                "question_number": question_num,
                "answer": q["answer"]
            }
            
            question_paper["questions"].append(question_entry)
            question_paper["answer_key"].append(answer_entry)
            question_paper["total_marks"] += marks
        
        return question_paper
    
    def _generate_questions_for_paper_with_templates(self, context, specifications):
        """Helper method to generate questions for paper using templates."""
        all_questions = []
        
        # Generate questions for each specification
        for spec in specifications.get("question_specs", []):
            taxonomy_level = TaxonomyLevel(spec["taxonomy_level"])
            difficulty = DifficultyLevel(spec["difficulty"])
            count = spec.get("count", 2)
            marks = spec.get("marks", 5)
            
            # Generate questions using templates
            generated_questions = self.generate_template_questions(
                context, taxonomy_level, difficulty, count
            )
            
            # Add marks information
            for q in generated_questions:
                q["marks"] = marks
            
            all_questions.extend(generated_questions)
        
        return all_questions
    
    def save_question_paper(self, question_paper: Dict, filename: str = "question_paper.json"):
        """Save question paper to JSON file."""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(question_paper, f, indent=2, ensure_ascii=False)
        print(f"Question paper saved to {filename}")
    
    def save_question_paper_as_pdf(self, question_paper: Dict, filename: str = "question_paper.pdf", include_answers: bool = True):
        """Save question paper to PDF file."""
        try:
            # Import ReportLab components for PDF generation
            from reportlab.lib.pagesizes import A4
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
            from reportlab.lib.units import inch
            import io
            
            # Create the PDF document using ReportLab
            doc = SimpleDocTemplate(
                filename,
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72,
                title=f"Question Paper: {question_paper['title']}"
            )
            
            # Container for the 'Flowable' objects
            elements = []
            
            # Define styles
            styles = getSampleStyleSheet()
            title_style = styles['Heading1']
            heading2_style = styles['Heading2']
            normal_style = styles['Normal']
            
            # Add custom styles
            question_style = ParagraphStyle(
                'QuestionStyle',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=12,
                leading=14,
                spaceAfter=6
            )
            
            answer_style = ParagraphStyle(
                'AnswerStyle',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=11,
                leftIndent=20,
                leading=14
            )
            
            # Add title
            elements.append(Paragraph(f"{question_paper['title']}", title_style))
            elements.append(Spacer(1, 0.25 * inch))
            
            # Add instructions
            elements.append(Paragraph(f"<b>Instructions:</b> {question_paper['instructions']}", normal_style))
            elements.append(Spacer(1, 0.15 * inch))
            
            # Add total marks
            elements.append(Paragraph(f"<b>Total Marks:</b> {question_paper['total_marks']}", normal_style))
            elements.append(Spacer(1, 0.25 * inch))
            
            # Add separator line
            elements.append(HRFlowable(width="100%", thickness=1, color=colors.black))
            elements.append(Spacer(1, 0.25 * inch))
            
            # Add questions heading
            elements.append(Paragraph("Questions:", heading2_style))
            elements.append(Spacer(1, 0.15 * inch))
            
            # Add each question
            for q in question_paper["questions"]:
                # Question number, content and marks
                elements.append(Paragraph(f"<b>Q{q['question_number']}.</b> {q['question']} <i>[{q['marks']} marks]</i>", question_style))
                elements.append(Paragraph(f"<i>(Level: {q['taxonomy_level']}, Difficulty: {q['difficulty']})</i>", answer_style))
                elements.append(Spacer(1, 0.15 * inch))
            
            # Add separator line
            elements.append(HRFlowable(width="100%", thickness=1, color=colors.black))
            elements.append(Spacer(1, 0.25 * inch))
            
            # Add answer key if requested
            if include_answers:
                elements.append(Paragraph("Answer Key:", heading2_style))
                elements.append(Spacer(1, 0.15 * inch))
                
                for a in question_paper["answer_key"]:
                    elements.append(Paragraph(f"<b>Q{a['question_number']}. Answer:</b>", question_style))
                    elements.append(Paragraph(f"{a['answer']}", answer_style))
                    if 'context_snippet' in a:
                        elements.append(Paragraph(f"<b>Context:</b> {a['context_snippet']}", answer_style))
                    elements.append(Spacer(1, 0.2 * inch))
            
            # Build the PDF document
            doc.build(elements)
            print(f"Question paper saved to {filename}")
            return True
        
        except ImportError as e:
            print(f"Error: ReportLab library not installed. {e}")
            print("Please install ReportLab using: pip install reportlab")
            return False
        except Exception as e:
            print(f"Error generating PDF: {e}")
            return False
    
    def print_question_paper(self, question_paper: Dict):
        """Print formatted question paper."""
        print("=" * 60)
        print(f"QUESTION PAPER: {question_paper['title']}")
        print("=" * 60)
        print(f"Instructions: {question_paper['instructions']}")
        print(f"Total Marks: {question_paper['total_marks']}")
        print("=" * 60)
        
        for q in question_paper["questions"]:
            print(f"\nQ{q['question_number']}. {q['question']} [{q['marks']} marks]")
            print(f"    (Level: {q['taxonomy_level']}, Difficulty: {q['difficulty']})")
        
        print("\n" + "=" * 60)
        print("ANSWER KEY")
        print("=" * 60)
        
        for a in question_paper["answer_key"]:
            print(f"\nQ{a['question_number']}. Answer:")
            print(f"    {a['answer']}")
            print(f"    Context: {a['context_snippet']}")

# Example usage and demonstration
def main():
    # Sample context
    sample_context = """
    Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines 
    capable of performing tasks that typically require human intelligence. Machine learning is a subset of AI 
    that enables computers to learn and improve from experience without being explicitly programmed. 
    Deep learning, a subset of machine learning, uses neural networks with multiple layers to analyze 
    and learn from large amounts of data. AI applications include natural language processing, computer vision, 
    robotics, and autonomous vehicles. The development of AI has raised important ethical considerations 
    regarding privacy, job displacement, and decision-making transparency.
    """
    
    # Initialize question generator
    # For OpenAI API usage: generator = QuestionGenerator(use_openai=True, openai_api_key="your-api-key")
    generator = QuestionGenerator(use_openai=True)
    
    # Define question paper specifications
    specifications = {
        "title": "Artificial Intelligence Assessment",
        "instructions": "Answer all questions based on your understanding of the given context about AI.",
        "question_specs": [
            {
                "taxonomy_level": "Remember",
                "difficulty": "Easy",
                "count": 2,
                "marks": 3
            },
            {
                "taxonomy_level": "Understand",
                "difficulty": "Medium",
                "count": 2,
                "marks": 5
            },
            {
                "taxonomy_level": "Apply",
                "difficulty": "Medium",
                "count": 1,
                "marks": 7
            },
            {
                "taxonomy_level": "Analyze",
                "difficulty": "Hard",
                "count": 1,
                "marks": 10
            }
        ]
    }
    
    # Generate question paper
    question_paper = generator.generate_question_paper(sample_context, specifications)
    
    # Print the question paper
    generator.print_question_paper(question_paper)
    
    # Save to JSON file
    generator.save_question_paper(question_paper, "ai_question_paper.json")
    
    # Save to PDF file
    generator.save_question_paper_as_pdf(question_paper, "ai_question_paper.pdf", include_answers=True)
    print("\nQuestion paper has been saved in both JSON and PDF formats.")
    print("PDF file includes the answer key. To generate without answers, set include_answers=False")

if __name__ == "__main__":
    # main()
    pass
