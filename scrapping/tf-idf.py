import nltk
import ssl

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

# get all the key_words from all the  docs
for i in range(1,total_doc+1):
  with open("Corpus/leet_prob"+str(i)+".txt") as f:
    doc=f.read()
    doc=doc.lower()
    prob_des.append(doc)

  total_words=prob_des[i-1].split()
  for each_word in total_words:
    each_word=each_word.replace('.','')
    if each_word not in stop_words:
      if each_word not in all_key_words:
        all_key_words.append(each_word)

(all_key_words).sort()
# print(len(all_key_words)) 
        
# calculate the tf score vector
for i in range(1,total_doc+1):
  total_words=prob_des[i-1].split()
  total_kword_doc=0
  tf_score={}
  key_words=[]
  for each_word in total_words:
    each_word=each_word.replace('.','')
    if each_word not in stop_words:
      total_kword_doc+=1
      if each_word not in key_words:
        key_words.append(each_word)
      if each_word in tf_score:
        tf_score[each_word]+=1
      else:
        tf_score[each_word]=1
  # fill the nt dict
  for ele in all_key_words:
    if ele in key_words:
      if ele in nt:
        nt[ele]+=1
      else:
        nt[ele]=1
    else:
      tf_score[ele]=0
  # update the tf score
  tf_score.update((x,y/int(total_kword_doc)) for x,y in tf_score.items())
  # print(tf_score)