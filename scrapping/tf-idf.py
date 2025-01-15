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
        
    
