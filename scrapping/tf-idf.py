import nltk
import ssl
import os
import re
from numpy import log10
try:
  _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
  pass
else:
  ssl._create_default_https_context = _create_unverified_https_context

nltk.download('punkt')
nltk.download('stopwords')
from nltk.corpus import stopwords
stop_words = set(stopwords.words('english'))
# print(stop_words)

prob_des=[]
all_key_words=[]
total_doc=1737
# dict to store thr cnt of how many docs contain a given key_word
nt={}
# list of list to storee the term freq values of each doc
tf_matrix=[]
# get all the key_words from all the  docs
# Function to clean and tokenize text
def clean_and_tokenize(text):
    # Tokenize the text and remove non-alphabetic characters (punctuation, numbers)
    words = re.findall(r'\b\w+\b', text.lower())  # Tokenize and convert to lowercase
    # Remove stopwords
    filtered_words = [word for word in words if word not in stop_words]
    return filtered_words

# Loop through all the documents in the corpus directory
for i in range(1, total_doc + 1):
    file_path = f"Corpus/leet_prob{i}.txt"  # Path to each document
    
    # Open and read the document
    with open(file_path, 'r', encoding='utf-8') as f:
        doc = f.read().lower()  # Read and convert the text to lowercase
        prob_des.append(doc)  # Store the document text
        
        # Clean and tokenize the document
        total_words = clean_and_tokenize(doc)
        
        # Add keywords to the list (only unique ones)
        for each_word in total_words:
            if each_word not in all_key_words:
                all_key_words.append(each_word)

# Sort the keywords
all_key_words.sort()

# Save all unique keywords to a text file
with open("all_keywords.txt", "w+", encoding="utf-8") as f:
    f.write('\n'.join(all_key_words))

print(f"Total unique keywords extracted: {len(all_key_words)}")

        
# # calculate the tf score vector
# for i in range(1,total_doc+1):
#   total_words=prob_des[i-1].split()
#   total_kword_doc=0
#   tf_score={}
#   key_words=[]
#   for each_word in total_words:
#     each_word=each_word.replace('.','')
#     if each_word not in stop_words:
#       total_kword_doc+=1
#       if each_word not in key_words:
#         key_words.append(each_word)
#       if each_word in tf_score:
#         tf_score[each_word]+=1
#       else:
#         tf_score[each_word]=1
#   # fill the nt dict
#   for ele in all_key_words:
#     if ele in key_words:
#       if ele in nt:
#         nt[ele]+=1
#       else:
#         nt[ele]=1
#     else:
#       tf_score[ele]=0
#   # update the tf score
#   tf_score.update((x,y/int(total_kword_doc)) for x,y in tf_score.items())
#   # print(tf_score)
#   templist=[]
#   for x,y in tf_score.items():
#     templist.append([x,y])
#   templist.sort()
#   temp=[]
#   for ele in templist:
#     # push the tf values
#     temp.append(ele[1])
#   tf_matrix.append(temp)

# idf_score=[]
# # calculate the idf score of each key word
# for word in all_key_words:
#   val=log10(total_doc/nt[word])
#   idf_score.append(val)

# # create the tf-idf matrix[doc][keyword]

# for i in range(0,len(all_key_words)):
#   for j in range(0,total_doc):
#     tf_matrix[j][i]=str(round(tf_matrix[j][i]*idf_score[i],2))

# # save the tf_matrix values per doc in txt files
# for i in range(0,total_doc):
#   with open("tf_idf_Matrix.txt","a",encoding="utf-8") as f:
#     f.write(','.join(tf_matrix[i]))
#     f.write('\n')


# # save the idf score in a txt file
# with open("idf_score.txt","w+",encoding="utf-8") as f:
#   f.write('\n'.join((idf_score)))