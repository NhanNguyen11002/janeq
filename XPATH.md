# Problem description:

<library> 
    <book> 
    <title>toto1</title> 
    <author>titi</author> 
  </book> 
  <book type="doc"> 
    <title>toto2</title> 
    <author>titi</author> 
  </book> 
  <book type="roman"> 
    <title>toto3</title> 
    <author>titi</author> 
  </book> 
  <book type="bd"> 
    <title>toto4</title> 
    <author>titi2</author> 
  </book> 
  <library> 
    <book type="roman"> 
      <title>toto5</title> 
      <author>titi</author> 
    </book> 
  </library> 
</library> 


1. Return all book elements 
Ans: //book
2. Return all title elements whose parent is a book element with a type attribute equal to novel
Ans: //title[parent::book[@type='novel']]
3. Return the number of book elements with a type attribute equal to comic
Ans: count(//book[@type='comic'])
4. What does the following XPath query return: /library/library/ancestor-or-self::library 
Ans: library